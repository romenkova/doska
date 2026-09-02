const num = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const list = (value: string | undefined): string[] =>
  value
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean) ?? []

// BASE_URL is compared and concatenated against request origins everywhere; a
// trailing slash would double up the `/` in built URLs.
const trimSlash = (value: string | undefined): string | undefined =>
  value?.replace(/\/+$/, "")

export const env = {
  isProduction: process.env.NODE_ENV === "production",

  // HTTP server
  host: process.env.HOST ?? "0.0.0.0",
  port: num(process.env.PORT, 3000),
  baseUrl: trimSlash(process.env.BASE_URL),
  appVersion: process.env.APP_VERSION,

  // Database: DATABASE_URL points at Postgres; without it the server falls back
  // to an embedded PGlite store at DB_FILE.
  databaseUrl: process.env.DATABASE_URL,
  dbFile: process.env.DB_FILE,

  // Auth. AUTH_SECRET is required; auth/index.ts throws when it's missing.
  authSecret: process.env.AUTH_SECRET ?? "",
  authLogin: process.env.AUTH_LOGIN ?? "",
  authPassword: process.env.AUTH_PASSWORD ?? "",
  authTrustedOrigins: list(process.env.AUTH_TRUSTED_ORIGINS),
  authRateLimit: process.env.AUTH_RATE_LIMIT !== "off",

  // Single sign-on through one OIDC provider. OIDC_ISSUER switches it on; the
  // other two are then required (auth/oidc.ts throws without them).
  oidcIssuer: trimSlash(process.env.OIDC_ISSUER),
  oidcClientId: process.env.OIDC_CLIENT_ID ?? "",
  oidcClientSecret: process.env.OIDC_CLIENT_SECRET ?? "",
  oidcName: process.env.OIDC_NAME || "SSO",
  oidcAutoCreate: process.env.OIDC_AUTO_CREATE !== "off",

  // Public board links. Their route is the only unauthenticated data endpoint
  // here, and better-auth's own limiter covers `/api/auth` alone, so it gets its
  // own per-IP cap — with the same "off" escape hatch, for e2e and for a
  // self-host sitting behind a proxy that already limits.
  publicRateLimit: process.env.PUBLIC_RATE_LIMIT !== "off",

  // Logging
  logLevel: process.env.LOG_LEVEL,
  noColor: Boolean(process.env.NO_COLOR),

  // Dev-only PGlite socket bridge (serve-dev.ts)
  pgSocketHost: process.env.PG_SOCKET_HOST ?? "127.0.0.1",
  pgSocketPort: num(process.env.PG_SOCKET_PORT, 5432),
} as const
