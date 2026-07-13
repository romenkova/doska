import { RPCHandler } from "@orpc/server/node"
import type { FastifyInstance } from "fastify"
import { router } from "../router"

const handler = new RPCHandler(router)

/**
 * The sync API — the procedures in `router.ts` over oRPC. Registered inside the
 * protected scope, so a session is established before any procedure runs.
 */
export function registerRpcRoutes(app: FastifyInstance): void {
  app.all("/api/rpc/*", async (req, reply) => {
    const { matched } = await handler.handle(req.raw, reply.raw, {
      prefix: "/api/rpc",
      context: {},
    })
    if (matched) return reply.hijack()
    reply.code(404).send("Not Found")
  })
}
