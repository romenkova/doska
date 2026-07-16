// The session rides in a cookie on web; desktop has no usable cookie jar in the
// webview, so `auth-client` stores the token the server echoes back and it is
// sent as a bearer from then on.

import { isDesktop } from "../platform"

const TOKEN_KEY = "deck:session-token"

export function getSessionToken(): string | null {
  if (!isDesktop()) return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setSessionToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearSessionToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}
