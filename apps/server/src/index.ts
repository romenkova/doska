import { RPCHandler } from "@orpc/server/node"
import Fastify from "fastify"
import {
  checkCredentials,
  clearCookie,
  getLogin,
  isAuthed,
  issueToken,
  readJson,
  sessionCookie,
} from "./auth"
import { router } from "./router"
import { registerFileRoutes } from "./files"
import { registerUpdateRoutes } from "./updates"
import { runMigrations } from "./db/utils/run-migrations"
import pkg from "../package.json" with { type: "json" }

const handler = new RPCHandler(router)
const app = Fastify({ logger: true })

// Don't let Fastify consume the request body, oRPC reads the raw stream.
app.addContentTypeParser("application/json", (_req, _payload, done) => {
  done(null, undefined)
})

// Exchanges the single configured login/password for a session cookie. Reads
// the body off the raw stream since the content-type parser above is a no-op.
app.post("/api/auth/login", async (req, reply) => {
  const body = (await readJson(req.raw)) as
    | { login?: unknown; password?: unknown }
    | undefined
  if (!checkCredentials(body?.login, body?.password)) {
    return reply.code(401).send({ error: "Invalid credentials" })
  }
  reply.header("set-cookie", sessionCookie(issueToken()))
  return reply.send({ authed: true })
})

// Clears the session cookie.
app.post("/api/auth/logout", async (_req, reply) => {
  reply.header("set-cookie", clearCookie())
  return reply.send({ authed: false })
})

// Lets the client check whether the current cookie is still a valid session,
// and names the session (the configured login) when it is.
app.get("/api/auth/me", async (req, reply) => {
  const authed = isAuthed(req.raw)
  return reply.send({ authed, login: authed ? getLogin() : null })
})

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

// Attachment upload/download endpoints (S3), session-protected.
registerFileRoutes(app)

app.all("/api/rpc/*", async (req, reply) => {
  // The sync API is the protected surface: no valid session, no access.
  if (!isAuthed(req.raw)) {
    return reply.code(401).send({ error: "Unauthorized" })
  }
  const { matched } = await handler.handle(req.raw, reply.raw, {
    prefix: "/api/rpc",
    context: {},
  })
  if (matched) return reply.hijack()
  reply.code(404).send("Not Found")
})

const port = Number(process.env.PORT ?? 3000)
// Bind all interfaces, not Fastify's default loopback — in a container the
// reverse proxy reaches this from another container, so 127.0.0.1 isn't enough.
const host = process.env.HOST ?? "0.0.0.0"
// Bring the schema up to date before accepting any sync writes.
runMigrations()
  .then(() => app.listen({ port, host }))
  .catch((err) => {
    app.log.error(err)
    process.exit(1)
  })
