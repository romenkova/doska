/**
 * The better-auth client the app signs in with.
 *
 *  - **Web.** The server is same-origin, so the session rides in the cookie
 *    better-auth sets on sign-in and nothing else is needed.
 *  - **Desktop.** A native app against a server on some other origin, with no
 *    usable cookie jar in the webview. The server's `bearer` plugin echoes the
 *    session token back on the `set-auth-token` response header; we keep it and
 *    send it as `Authorization: Bearer` from then on.
 */

import { createAuthClient } from "better-auth/react"
import { usernameClient } from "better-auth/client/plugins"
import { apiUrl, isDesktop, rawFetch } from "./runtime"

const TOKEN_KEY = "deck:session-token"

export function getSessionToken(): string | null {
  if (!isDesktop()) return null
  return localStorage.getItem(TOKEN_KEY)
}

export function clearSessionToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

function create(baseURL: string) {
  return createAuthClient({
    baseURL,
    plugins: [usernameClient()],
    fetchOptions: {
      // On desktop this routes through Tauri's HTTP plugin, so the request runs
      // in Rust and bypasses the webview's CORS.
      customFetchImpl: rawFetch,
      credentials: "include",
      auth: { type: "Bearer", token: () => getSessionToken() ?? undefined },
      onSuccess: ({ response }) => {
        if (!isDesktop()) return
        const token = response.headers.get("set-auth-token")
        if (token) localStorage.setItem(TOKEN_KEY, token)
      },
    },
  })
}

let cached: { baseURL: string; client: ReturnType<typeof create> } | null = null

/**
 * The client is rebuilt whenever the server URL changes: its `baseURL` is fixed
 * at construction, and on desktop the user picks the server at sign-in time.
 */
export function authClient(): ReturnType<typeof create> {
  const baseURL = apiUrl("")
  if (cached?.baseURL !== baseURL) cached = { baseURL, client: create(baseURL) }
  return cached.client
}
