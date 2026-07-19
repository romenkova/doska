import { fromNodeHeaders } from "better-auth/node"
import type { FastifyReply, FastifyRequest } from "fastify"
import { env } from "../env"
import { auth } from "."

/** Resolves the server's public origin, preferring the configured base URL. */
export function originOf(req: FastifyRequest): string {
  if (env.baseUrl) return env.baseUrl
  return `${req.protocol}://${req.headers.host ?? "localhost"}`
}

/** Guards private routes: rejects with 401 unless a valid cookie/bearer session exists. */
export async function requireSession(
  req: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const headers = fromNodeHeaders(req.headers)

  // Browser (cookie) and desktop (bearer) alike: one session, one lookup.
  const session = await auth.api.getSession({ headers })
  if (!session) {
    await reply.code(401).send({ error: "Unauthorized" })
  }
}

/** Guards MCP routes: 401 with an OAuth `WWW-Authenticate` challenge when the token is missing. */
export async function requireMCPSession(
  req: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const headers = fromNodeHeaders(req.headers)
  const token = await auth.api.getMcpSession({ headers })

  if (!token) {
    await reply
      .code(401)
      .header(
        "www-authenticate",
        `Bearer resource_metadata="${originOf(req)}/.well-known/oauth-protected-resource"`
      )
      .header("access-control-expose-headers", "WWW-Authenticate")
      .send({ error: "Unauthorized" })
  }
}
