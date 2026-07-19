import { fromNodeHeaders } from "better-auth/node"
import type { FastifyReply, FastifyRequest } from "fastify"
import { env } from "../env"
import { auth } from "."

/**
 * The single check in front of everything private: sync, files, MCP. It runs as
 * an `onRequest` hook on the protected scope, so a route can't be added there
 * and forget to authenticate.
 */

/**
 * The server's public origin.
 */
export function originOf(req: FastifyRequest): string {
  if (env.baseUrl) return env.baseUrl
  return `${req.protocol}://${req.headers.host ?? "localhost"}`
}

export async function requireSession(
  req: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const headers = fromNodeHeaders(req.headers)

  // MCP clients hold an OAuth access token, not a session — different check, and
  // a different 401. The header is what sends a client that has no token looking:
  // it points at the metadata naming the authorization server, and the client
  // walks from there to registration and the login page.
  if (req.url === "/mcp" || req.url.startsWith("/mcp?")) {
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
    return
  }

  // Browser (cookie) and desktop (bearer) alike: one session, one lookup.
  const session = await auth.api.getSession({ headers })
  if (!session) {
    await reply.code(401).send({ error: "Unauthorized" })
  }
}
