import { toNodeHandler } from "better-auth/node"
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"
import { auth } from "../auth"
import { OIDC_PROVIDER_ID } from "../auth/oidc"
import { env } from "../env"

const authHandler = toNodeHandler(auth)

async function delegateToAuth(
  req: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  req.raw.headers["x-forwarded-for"] = req.ip
  await authHandler(req.raw, reply.raw)
  return reply.hijack()
}

/** better-auth owns /api/auth/* — these are the public, pre-session routes. */
export function registerAuthRoutes(app: FastifyInstance): void {
  // Accounts come from an admin (the first from AUTH_LOGIN/AUTH_PASSWORD, the
  // rest through the admin plugin) or from a first SSO sign-in.
  for (const url of ["/api/auth/sign-up", "/api/auth/sign-up/*"]) {
    app.all(url, async (_req, reply) =>
      reply.code(403).send({ error: "Sign-up is disabled" })
    )
  }

  app.get("/api/sso", async (_req, reply) =>
    reply.send({
      providers: env.oidcIssuer
        ? [{ id: OIDC_PROVIDER_ID, name: env.oidcName }]
        : [],
    })
  )

  app.all("/api/auth/*", delegateToAuth)

  // OAuth clients look for discovery at the well-known root, but better-auth
  // serves it under its own prefix — so rewrite the path and hand it over.
  for (const path of [
    "/.well-known/oauth-authorization-server",
    "/.well-known/oauth-protected-resource",
  ]) {
    app.get(path, async (req, reply) => {
      req.raw.url = `/api/auth${path}`
      return delegateToAuth(req, reply)
    })
  }
}
