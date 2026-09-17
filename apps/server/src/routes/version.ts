import type { FastifyInstance } from "fastify"
import pkg from "../../package.json" with { type: "json" }
import { env } from "../env"

export function registerVersionRoutes(app: FastifyInstance): void {
  app.get("/api/version", async (_req, reply) => {
    return reply.send({ version: env.appVersion || pkg.version })
  })
}
