import Fastify from "fastify"
import type { FastifyInstance } from "fastify"
import { requireSession } from "./auth/guard"
import { loggerOptions, registerRequestLogging } from "./logger"
import { registerAuthRoutes } from "./routes/auth"
import { registerFileRoutes, type ServerStorage } from "./routes/files"
import { registerMcpRoutes } from "./routes/mcp"
import { registerRpcRoutes } from "./routes/rpc"
import { registerUpdateRoutes } from "./routes/updates"

interface BuildOptions {
  /** Override attachment storage (tests pass an in-memory fake). */
  storage?: ServerStorage | null
}

/**
 * Wires the whole server and returns it without listening, so tests can drive it
 * through `app.inject` and the bootstrap in `index.ts` can migrate/seed first.
 */
export function buildApp(opts: BuildOptions = {}): FastifyInstance {
  // Behind nginx the socket peer is the proxy, so without this every request
  // looks like it came from loopback — one rate-limit bucket for the whole
  // internet.
  const app = Fastify({
    logger: loggerOptions,
    trustProxy: true,
    disableRequestLogging: true,
  })

  registerRequestLogging(app)

  // better-auth, oRPC and MCP each consume the raw request stream themselves, so
  // Fastify must not drain it into a parsed body first. Consequence: `req.body`
  // is undefined everywhere on this server — a new route wanting one must
  // register its own parser.
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
    registerFileRoutes(scope, opts.storage)
    registerMcpRoutes(scope)
  })

  return app
}
