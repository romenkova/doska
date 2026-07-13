import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { bearer, mcp, username } from "better-auth/plugins"
import { getDB } from "../db/get-db"
import * as schema from "../db/schema"

/**
 * The authorization server. One account, three kinds of client, one session
 * model underneath all of them:
 *
 *  - the **browser** holds a session cookie, set on sign-in;
 *  - the **desktop app** holds the same session as a bearer token (`bearer`),
 *    because a native webview has no usable cookie jar against a remote origin;
 *  - **MCP clients** (Claude Code, Claude Desktop, claude.ai) run OAuth 2.1 —
 *    dynamic registration, PKCE, consent — against the `mcp` plugin, and hold an
 *    access token bound to this server.
 *
 * The account is a real user row, seeded from AUTH_LOGIN/AUTH_PASSWORD (see
 * `seed.ts`) so a self-hosted deploy keeps configuring itself the same way.
 */

const secret = process.env.AUTH_SECRET ?? ""
if (!secret) throw new Error("Auth misconfigured: set AUTH_SECRET.")

export const auth = betterAuth({
  secret,
  baseURL: process.env.BASE_URL?.replace(/\/$/, ""),
  trustedOrigins: [
    "tauri://localhost",
    "http://tauri.localhost",
    "https://tauri.localhost",
    ...(process.env.AUTH_TRUSTED_ORIGINS?.split(",")
      .map((o) => o.trim())
      .filter(Boolean) ?? []),
  ],
  database: drizzleAdapter(getDB(), { provider: "pg", schema }),
  emailAndPassword: { enabled: true, minPasswordLength: 1 },
  session: {
    cookieCache: { enabled: true, maxAge: 60 },
  },
  rateLimit: {
    enabled: process.env.AUTH_RATE_LIMIT !== "off",
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/username": { window: 900, max: 10 },
      "/sign-in/email": { window: 900, max: 10 },
    },
  },

  plugins: [
    username({ minUsernameLength: 1, usernameValidator: () => true }),
    bearer(),
    mcp({ loginPage: "/sign-in" }),
  ],
})
