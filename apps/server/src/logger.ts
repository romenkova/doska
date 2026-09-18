import type { FastifyBaseLogger } from "fastify"
import { env } from "./env"

export const loggerOptions = env.isProduction
  ? { level: env.logLevel ?? "info" }
  : {
      level: env.logLevel ?? "debug",
      transport: { target: "pino-pretty" },
    }

let logger: FastifyBaseLogger | undefined

export function setLogger(log: FastifyBaseLogger): void {
  logger = log
}

export function getLogger(): FastifyBaseLogger | undefined {
  return logger
}
