import type { FastifyInstance } from "fastify"

const isDev = process.env.NODE_ENV !== "production"
const color = isDev && !process.env.NO_COLOR

const ANSI = {
  bold: 1,
  dim: 2,
  red: 31,
  green: 32,
  yellow: 33,
  cyan: 36,
  gray: 90,
} as const

type AnsiCode = (typeof ANSI)[keyof typeof ANSI]

const paint = (code: AnsiCode, s: string) =>
  color ? `\x1b[${code}m${s}\x1b[0m` : s

const dim = (s: string) => paint(ANSI.dim, s)
const bold = (s: string) => paint(ANSI.bold, s)

function statusColor(status: number, s: string): string {
  switch (true) {
    case status >= 500:
      return paint(ANSI.red, s)
    case status >= 400:
      return paint(ANSI.yellow, s)
    case status >= 300:
      return paint(ANSI.cyan, s)
    default:
      return paint(ANSI.green, s)
  }
}

// Slow requests should catch the eye without reading the number.
function durationColor(ms: number, s: string): string {
  switch (true) {
    case ms >= 100:
      return paint(ANSI.red, s)
    case ms >= 50:
      return paint(ANSI.yellow, s)
    default:
      return paint(ANSI.gray, s)
  }
}

export const loggerOptions = isDev
  ? {
      level: process.env.LOG_LEVEL ?? "debug",
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss",
          ignore: "pid,hostname,reqId,req,res",
          singleLine: true,
        },
      },
    }
  : { level: process.env.LOG_LEVEL ?? "info" }

export function registerRequestLogging(app: FastifyInstance): void {
  app.addHook("onResponse", async (req, reply) => {
    const ms = reply.elapsedTime
    const status = statusColor(reply.statusCode, String(reply.statusCode))
    const method = bold(req.method.padEnd(6))
    const duration = durationColor(ms, `${ms.toFixed(1)}ms`)
    req.log.info(`${status} ${method} ${req.url} ${dim("·")} ${duration}`)
  })

  app.addHook("onError", async (req, _reply, err) => {
    req.log.error({ err }, `${bold(req.method)} ${req.url} failed`)
  })
}
