import { isDesktop } from "../platform"
import { getSessionToken } from "./session-token"

/**
 * `fetch` with no session attached. On desktop it routes through Tauri's HTTP
 * plugin so the request runs in Rust, bypassing the webview's CORS.
 *
 * This is what better-auth's own client is built on — see `auth-client`.
 */
export const rawFetch: typeof fetch = async (input, init) => {
  if (isDesktop()) {
    const { fetch: tauriFetch } = await import("@tauri-apps/plugin-http")
    return tauriFetch(input, init)
  }
  return globalThis.fetch(input, init)
}

/** `fetch` carrying the session: the cookie on web, the bearer token on desktop. */
export const appFetch: typeof fetch = async (input, init) => {
  const headers = new Headers(
    init?.headers ?? (input instanceof Request ? input.headers : undefined)
  )
  const token = getSessionToken()
  if (token) headers.set("authorization", `Bearer ${token}`)

  return rawFetch(input, { ...init, credentials: "include", headers })
}
