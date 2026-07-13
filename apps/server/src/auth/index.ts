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
  // The public origin: the OAuth issuer, and what tokens are bound to. Behind a
  // reverse proxy the request's own Host is the internal one, so this must be
  // configured for any deploy that isn't plain localhost.
  baseURL: process.env.BASE_URL?.replace(/\/$/, ""),

  // better-auth's CSRF defence rejects any request whose `Origin` isn't the
  // server's own. Two legitimate callers aren't: the Vite dev server, which
  // serves the app from another port and proxies here, and the desktop webview,
  // which has an app-scheme origin of its own.
  trustedOrigins: [
    "tauri://localhost",
    "http://tauri.localhost",
    "https://tauri.localhost",
    ...(process.env.AUTH_TRUSTED_ORIGINS?.split(",")
      .map((o) => o.trim())
      .filter(Boolean) ?? []),
  ],

  database: drizzleAdapter(getDB(), { provider: "pg", schema }),

  // The one account signs in with a login and a password. `username` is what
  // makes the login a login — AUTH_LOGIN has never had to be an email, and
  // turning it into one would break every existing deployment's config.
  //
  // No minimum length: AUTH_PASSWORD is deploy config an operator already chose,
  // and refusing to boot on a short one would strand existing installs.
  emailAndPassword: { enabled: true, minPasswordLength: 1 },

  session: {
    // Validating a session is a DB read, and the sync API is polled by every
    // client every few seconds. The cache carries the session in a short-lived
    // signed cookie, so the hot path stops touching Postgres; it costs up to a
    // minute of staleness after a sign-out, which the session's own expiry and
    // the bearer path both bound anyway.
    cookieCache: { enabled: true, maxAge: 60 },
  },

  // Credentials are the whole security boundary here, and the sign-in endpoints
  // are reachable by anyone. Cap them hard; the rest of the API is behind a
  // session already.
  //
  // The buckets are per-IP (see the `x-forwarded-for` hand-off in `index.ts`),
  // which the e2e suite can't satisfy: it is one loopback address signing in on
  // every test, which is exactly the shape of the brute force this exists to
  // stop. The harness switches it off rather than have the real numbers bent to
  // fit it.
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
    // Same reasoning as the password: AUTH_LOGIN is whatever the operator put in
    // the env years ago, so the defaults (3+ chars, `[a-zA-Z0-9_.]` only) can't
    // be allowed to reject it.
    username({ minUsernameLength: 1, usernameValidator: () => true }),
    bearer(),
    // Where an MCP client that isn't signed in gets sent. This is a route in
    // the web app, not a page the server renders — the plugin keeps the pending
    // authorization itself and resumes it once a session exists.
    mcp({ loginPage: "/sign-in" }),
  ],
})
