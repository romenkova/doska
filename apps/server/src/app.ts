import Fastify from "fastify"
import type { FastifyInstance } from "fastify"
import { requireMCPSession, requireSession } from "./auth/guard"
import { loggerOptions } from "./logger"
import { registerAuthRoutes } from "./routes/auth"
import { registerFileRoutes, type ServerStorage } from "./routes/files"
import { registerMcpRoutes } from "./routes/mcp"
import { registerRpcRoutes } from "./routes/rpc"
import { registerUpdateRoutes } from "./routes/updates"

interface BuildOptions {
  storage?: ServerStorage | null
}

export function buildApp(opts: BuildOptions = {}): FastifyInstance {
  const app = Fastify({
    logger: loggerOptions,
    trustProxy: true,
  })

  // better-auth, oRPC and MCP each consume the raw request stream themselves, so
  // Fastify must not drain it into a parsed body first. Consequence: `req.body`
  // is undefined everywhere on this server — a new route wanting one must
  // register its own parser.
  for (const type of [
    "application/json",
    "application/x-www-form-urlencoded",
  ]) {
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
  })

  app.register(async (scope) => {
    scope.addHook("onRequest", requireMCPSession)

    registerMcpRoutes(scope)
  })

  return app
}
