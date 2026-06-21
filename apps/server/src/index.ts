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
import { runMigrations } from "./db/utils/run-migrations"

const handler = new RPCHandler(router)
const app = Fastify({ logger: true })

// Don't let Fastify consume the request body, oRPC reads the raw stream.
app.addContentTypeParser("application/json", (_req, _payload, done) => {
  done(null, undefined)
})

// Exchanges the single configured login/password for a session cookie. Reads
// the body off the raw stream since the content-type parser above is a no-op.
app.post("/auth/login", async (req, reply) => {
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
app.post("/auth/logout", async (_req, reply) => {
  reply.header("set-cookie", clearCookie())
  return reply.send({ authed: false })
})

// Lets the client check whether the current cookie is still a valid session,
// and names the session (the configured login) when it is.
app.get("/auth/me", async (req, reply) => {
  const authed = isAuthed(req.raw)
  return reply.send({ authed, login: authed ? getLogin() : null })
})

app.all("/rpc/*", async (req, reply) => {
  // The sync API is the protected surface: no valid session, no access.
  if (!isAuthed(req.raw)) {
    return reply.code(401).send({ error: "Unauthorized" })
  }
  const { matched } = await handler.handle(req.raw, reply.raw, {
    prefix: "/rpc",
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
