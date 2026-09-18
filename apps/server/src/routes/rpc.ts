import { onError, ORPCError } from "@orpc/server"
import { RPCHandler } from "@orpc/server/node"
import type { FastifyInstance } from "fastify"
import { getLogger } from "../logger"
import { router } from "../router"

const handler = new RPCHandler(router, {
  clientInterceptors: [
    onError((error, { path, context }) => {
      const line = { err: error, path: path.join("."), userId: context.userId }
      if (error instanceof ORPCError) getLogger()?.warn(line, "rpc: refused")
      else getLogger()?.error(line, "rpc: failed")
    }),
  ],
})

/**
 * The sync API — the procedures in `router.ts` over oRPC. Registered inside the
 * protected scope, so a session is established before any procedure runs.
 */
export function registerRpcRoutes(app: FastifyInstance): void {
  app.all("/api/rpc/*", async (req, reply) => {
    const { matched } = await handler.handle(req.raw, reply.raw, {
      prefix: "/api/rpc",
      context: { userId: req.userId },
    })
    if (matched) return reply.hijack()
    reply.code(404).send("Not Found")
  })
}
