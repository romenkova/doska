import { createHmac, timingSafeEqual } from "node:crypto"
import type { IncomingMessage } from "node:http"

const COOKIE_NAME = "deck_session"
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

const LOGIN = process.env.AUTH_LOGIN ?? ""
const PASSWORD = process.env.AUTH_PASSWORD ?? ""
const SECRET = process.env.AUTH_SECRET ?? ""

if (!LOGIN || !PASSWORD || !SECRET) {
  throw new Error(
    "Auth misconfigured: set AUTH_LOGIN, AUTH_PASSWORD and AUTH_SECRET."
  )
}

export { COOKIE_NAME }

/** The configured login, surfaced to an authed client so the UI can name the session. */
export function getLogin(): string {
  return LOGIN
}

/** HMACs `payload` with the server secret, returned base64url. */
function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("base64url")
}

/** Length-safe equality so a mismatch can't be timed; unequal lengths are false. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  return ab.length === bb.length && timingSafeEqual(ab, bb)
}

/** True if the submitted credentials match the configured pair. */
export function checkCredentials(login: unknown, password: unknown): boolean {
  if (typeof login !== "string" || typeof password !== "string") return false
  // Compare both regardless of the first result to keep timing uniform.
  const okLogin = safeEqual(login, LOGIN)
  const okPassword = safeEqual(password, PASSWORD)
  return okLogin && okPassword
}

/** Mints a session token `<expiry>.<sig>`. */
export function issueToken(): string {
  const exp = String(Date.now() + SESSION_TTL_MS)
  return `${exp}.${sign(exp)}`
}

/** Verifies a token's signature and that it hasn't expired. */
export function verifyToken(token: string | undefined): boolean {
  if (!token) return false
  const dot = token.lastIndexOf(".")
  if (dot === -1) return false
  const exp = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  if (!safeEqual(sig, sign(exp))) return false
  const expMs = Number(exp)
  return Number.isFinite(expMs) && expMs > Date.now()
}

/** Pulls one cookie value out of a raw `Cookie` header. */
function readCookie(
  header: string | undefined,
  name: string
): string | undefined {
  if (!header) return undefined
  for (const part of header.split(";")) {
    const eq = part.indexOf("=")
    if (eq === -1) continue
    if (part.slice(0, eq).trim() === name) {
      return decodeURIComponent(part.slice(eq + 1).trim())
    }
  }
  return undefined
}

/** True if the request carries a valid session cookie. */
export function isAuthed(req: IncomingMessage): boolean {
  return verifyToken(readCookie(req.headers.cookie, COOKIE_NAME))
}

/** `Set-Cookie` value that stores the session token. */
export function sessionCookie(token: string): string {
  const maxAge = Math.floor(SESSION_TTL_MS / 1000)
  return `${COOKIE_NAME}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}`
}

/** `Set-Cookie` value that immediately clears the session. */
export function clearCookie(): string {
  return `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`
}

/** Reads and JSON-parses a request body off the raw stream (Fastify's parser is a no-op). */
export function readJson(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve) => {
    let data = ""
    req.on("data", (chunk) => {
      data += chunk
      // Guard against an unbounded body on an unauthenticated endpoint.
      if (data.length > 8192) req.destroy()
    })
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : undefined)
      } catch {
        resolve(undefined)
      }
    })
    req.on("error", () => resolve(undefined))
  })
}
