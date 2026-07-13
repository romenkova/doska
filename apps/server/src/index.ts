import Fastify from "fastify"
import { requireSession } from "./auth/guard"
import { seedAccount } from "./auth/seed"
import { runMigrations } from "./db/utils/run-migrations"
import { loggerOptions, registerRequestLogging } from "./logger"
import { registerAuthRoutes } from "./routes/auth"
import { registerFileRoutes } from "./routes/files"
import { registerMcpRoutes } from "./routes/mcp"
import { registerRpcRoutes } from "./routes/rpc"
import { registerUpdateRoutes } from "./routes/updates"

// Behind nginx the socket peer is the proxy, so without this every request looks
// like it came from loopback — one rate-limit bucket for the whole internet.
const app = Fastify({
  logger: loggerOptions,
  trustProxy: true,
  disableRequestLogging: true,
})

registerRequestLogging(app)

// better-auth, oRPC and MCP each consume the raw request stream themselves, so
// Fastify must not drain it into a parsed body first. Consequence: `req.body` is
// undefined everywhere on this server — a new route wanting one must register its
// own parser.
for (const type of ["application/json", "application/x-www-form-urlencoded"]) {
  app.addContentTypeParser(type, (_req, _payload, done) => {
    done(null, undefined)
  })
}

// Public: login, OAuth discovery, version, desktop updates.
registerAuthRoutes(app)
registerUpdateRoutes(app)

// Everything private, behind one session check.
app.register(async (scope) => {
  scope.addHook("onRequest", requireSession)

  registerRpcRoutes(scope)
  registerFileRoutes(scope)
  registerMcpRoutes(scope)
})

const port = Number(process.env.PORT ?? 3000)
const host = process.env.HOST ?? "0.0.0.0"

runMigrations()
  .then(seedAccount)
  .then(() => app.listen({ port, host }))
  .catch((err) => {
    app.log.error(err)
    process.exit(1)
  })
