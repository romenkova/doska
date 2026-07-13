import { RPCHandler } from "@orpc/server/node"
import { toNodeHandler } from "better-auth/node"
import Fastify, { type FastifyReply, type FastifyRequest } from "fastify"
import { auth } from "./auth"
import { requireSession } from "./auth/guard"
import { seedAccount } from "./auth/seed"
import { registerMcpRoutes } from "./mcp/routes"
import { router } from "./router"
import { registerFileRoutes } from "./files"
import { registerUpdateRoutes } from "./updates"
import { runMigrations } from "./db/utils/run-migrations"
import pkg from "../package.json" with { type: "json" }

const handler = new RPCHandler(router)
// Behind nginx the socket peer is the proxy, so without this every request looks
// like it came from loopback — one rate-limit bucket for the whole internet.
const app = Fastify({ logger: true, trustProxy: true })

// Nothing here reads `req.body`: oRPC, the MCP transport, the upload route and
// better-auth all consume the raw stream themselves. Fastify's default parsers
// would drain it out from under them, so they're replaced with no-ops.
for (const type of ["application/json", "application/x-www-form-urlencoded"]) {
  app.addContentTypeParser(type, (_req, _payload, done) => {
    done(null, undefined)
  })
}

// better-auth owns /api/auth/*: sign-in and session for the browser and the
// desktop app, plus the OAuth 2.1 authorization server (registration, PKCE,
// consent, tokens) that the MCP plugin brings with it.
const authHandler = toNodeHandler(auth)

/**
 * better-auth resolves the client IP from headers alone — it never sees the
 * socket — so with no `x-forwarded-for` it buckets *every* caller together and
 * one noisy client rate-limits the world. Fastify has already resolved the real
 * address (`trustProxy`), so hand it over as the single forwarded hop.
 */
async function delegateToAuth(
  req: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  req.raw.headers["x-forwarded-for"] = req.ip
  await authHandler(req.raw, reply.raw)
  return reply.hijack()
}

app.all("/api/auth/*", delegateToAuth)

// An MCP client discovers auth at the *root* of the origin (RFC 8414/9728), but
// better-auth serves that metadata under its own base path. Replay the request
// into the same handler rather than redirect, and rather than call the endpoints
// directly — the issuer they advertise is derived from the request, so it has to
// go through the router to come out right on a deploy with no BASE_URL set.
for (const path of [
  "/.well-known/oauth-authorization-server",
  "/.well-known/oauth-protected-resource",
]) {
  app.get(path, async (req, reply) => {
    req.raw.url = `/api/auth${path}`
    return delegateToAuth(req, reply)
  })
}

// Public version endpoint. The desktop app pins its updates to this: it only
// installs a release whose version matches the server's, so a client never runs
// ahead of a (possibly self-hosted) server it can't talk to.
//
// The git tag is the single source of truth across the product (the desktop
// build and the client stamp both derive from it). Deploys pass the same tag in
// as APP_VERSION (see docker-compose.base.yml), so this endpoint reports the
// release line the server is actually on without anyone bumping a file. The
// package.json version is only a last-resort fallback for a gitless tarball
// deploy. Use `||` not `??` so an empty APP_VERSION="" still falls back.
app.get("/api/version", async (_req, reply) => {
  return reply.send({ version: process.env.APP_VERSION || pkg.version })
})

// Public desktop update endpoint — the app polls this for new builds.
registerUpdateRoutes(app)

// Everything private lives in one encapsulated scope behind one hook, so a route
// added here cannot forget to authenticate.
app.register(async (scope) => {
  scope.addHook("onRequest", requireSession)

  // The sync API.
  scope.all("/api/rpc/*", async (req, reply) => {
    const { matched } = await handler.handle(req.raw, reply.raw, {
      prefix: "/api/rpc",
      context: {},
    })
    if (matched) return reply.hijack()
    reply.code(404).send("Not Found")
  })

  // Attachment upload/download (S3).
  registerFileRoutes(scope)

  // The board over MCP, for agents. Same data as the sync API.
  registerMcpRoutes(scope)
})

const port = Number(process.env.PORT ?? 3000)
// Bind all interfaces, not Fastify's default loopback — in a container the
// reverse proxy reaches this from another container, so 127.0.0.1 isn't enough.
const host = process.env.HOST ?? "0.0.0.0"
// Bring the schema up to date, and the account into existence, before serving.
runMigrations()
  .then(seedAccount)
  .then(() => app.listen({ port, host }))
  .catch((err) => {
    app.log.error(err)
    process.exit(1)
  })
