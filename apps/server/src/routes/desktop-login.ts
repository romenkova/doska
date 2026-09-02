import { randomBytes, timingSafeEqual } from "node:crypto"
import { fromNodeHeaders } from "better-auth/node"
import type { FastifyInstance, FastifyRequest } from "fastify"
import { auth } from "../auth"
import { env } from "../env"

const TTL_MS = 5 * 60 * 1000
const MAX_OPEN = 1000

type Attempt = { secret: string; token: string | null; expiresAt: number }

const attempts = new Map<string, Attempt>()

function live(id: string): Attempt | null {
  const attempt = attempts.get(id)
  if (!attempt) return null
  if (attempt.expiresAt <= Date.now()) {
    attempts.delete(id)
    return null
  }
  return attempt
}

function secretMatches(attempt: Attempt, req: FastifyRequest): boolean {
  const raw = req.headers["x-desktop-login-secret"]
  const given = (Array.isArray(raw) ? raw[0] : raw) ?? ""
  return (
    given.length === attempt.secret.length &&
    timingSafeEqual(Buffer.from(given), Buffer.from(attempt.secret))
  )
}

export function registerDesktopLoginRoutes(app: FastifyInstance): void {
  app.post("/api/desktop-login", async (_req, reply) => {
    const now = Date.now()
    for (const [id, attempt] of attempts)
      if (attempt.expiresAt <= now) attempts.delete(id)
    if (attempts.size >= MAX_OPEN)
      return reply.code(429).send({ error: "Too many sign-ins in progress" })

    const id = randomBytes(16).toString("base64url")
    const secret = randomBytes(32).toString("base64url")
    attempts.set(id, { secret, token: null, expiresAt: now + TTL_MS })

    const url = `${env.baseUrl ?? ""}/sign-in?desktop=${id}`
    return reply.send({ id, secret, url })
  })

  app.post<{ Params: { id: string } }>(
    "/api/desktop-login/:id/complete",
    async (req, reply) => {
      const attempt = live(req.params.id)
      if (!attempt) return reply.code(404).send({ error: "Sign-in expired" })

      const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
        query: { disableCookieCache: true },
      })
      if (!session) return reply.code(401).send({ error: "Unauthorized" })

      const ctx = await auth.$context
      const fresh = await ctx.internalAdapter.createSession(session.user.id)
      attempt.token = fresh.token
      return reply.code(204).send()
    }
  )

  app.post<{ Params: { id: string } }>(
    "/api/desktop-login/:id/token",
    async (req, reply) => {
      const attempt = live(req.params.id)
      if (!attempt || !secretMatches(attempt, req))
        return reply.code(404).send({ error: "Sign-in expired" })
      if (!attempt.token) return reply.send({ token: null })

      attempts.delete(req.params.id)
      return reply.send({ token: attempt.token })
    }
  )
}
