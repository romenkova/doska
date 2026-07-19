import { env } from "./env"

export const loggerOptions = env.isProduction
  ? { level: env.logLevel ?? "info" }
  : {
      level: env.logLevel ?? "debug",
      transport: { target: "pino-pretty" },
    }
