import type { GenericOAuthConfig } from "better-auth/plugins"
import { getDB } from "../db/get-db"
import { user } from "../db/schema"
import { env } from "../env"

export const OIDC_PROVIDER_ID = "oidc"

/**
 * The one identity provider, when OIDC_ISSUER is set.
 */
export function oidcProvider(): GenericOAuthConfig | null {
  if (!env.oidcIssuer) return null
  if (!env.oidcClientId || !env.oidcClientSecret)
    throw new Error(
      "Auth misconfigured: OIDC_ISSUER needs OIDC_CLIENT_ID and OIDC_CLIENT_SECRET."
    )

  return {
    providerId: OIDC_PROVIDER_ID,
    discoveryUrl: `${env.oidcIssuer}/.well-known/openid-configuration`,
    clientId: env.oidcClientId,
    clientSecret: env.oidcClientSecret,
    scopes: ["openid", "profile", "email"],
    pkce: true,
    disableSignUp: !env.oidcAutoCreate,
    mapProfileToUser: async (profile) => {
      const username = await freeUsername(loginFrom(profile))
      return {
        name:
          typeof profile.name === "string" && profile.name
            ? profile.name
            : username,
        email: emailFrom(profile),
        username,
        displayUsername: username,
      }
    },
  }
}

function emailFrom(profile: Record<string, unknown>): string {
  if (typeof profile.email === "string" && profile.email) return profile.email
  const sub = typeof profile.sub === "string" ? profile.sub : "unknown"
  return `${encodeURIComponent(sub)}@oidc.invalid`
}

function loginFrom(profile: Record<string, unknown>): string {
  const claim = profile.preferred_username ?? profile.email
  const login = typeof claim === "string" ? (claim.split("@")[0] ?? "") : ""
  return login.trim().toLowerCase() || "user"
}

async function freeUsername(base: string): Promise<string> {
  const rows = await getDB().select({ username: user.username }).from(user)
  const taken = new Set(rows.map((row) => row.username))
  if (!taken.has(base)) return base
  let n = 2
  while (taken.has(`${base}${n}`)) n += 1
  return `${base}${n}`
}
