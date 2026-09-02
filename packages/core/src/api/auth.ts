import { runtime } from "../runtime"
import { authClient } from "./auth-client"
import { isSyncConfigured } from "./server"

export type Session = {
  authed: boolean
  login: string | null
  userId: string | null
  isAdmin: boolean
}

const expiryListeners = new Set<() => void>()

/** Fires when the server rejects a request as unauthenticated, so the app can
 * flip to signed-out from one place rather than at every call site. */
export function onSessionExpired(listener: () => void): () => void {
  expiryListeners.add(listener)
  return () => {
    expiryListeners.delete(listener)
  }
}

export function sessionExpired(): void {
  for (const listener of expiryListeners) listener()
}

export const SIGNED_OUT: Session = {
  authed: false,
  login: null,
  userId: null,
  isAdmin: false,
}

export async function fetchSession(): Promise<Session> {
  if (!isSyncConfigured()) return SIGNED_OUT

  const { data, error } = await authClient().getSession()
  if (error) {
    if (error.status === 401 || error.status === 403) return SIGNED_OUT
    throw new Error(error.message ?? "Could not reach the server")
  }
  if (!data) return SIGNED_OUT
  return toSession(data.user)
}

function toSession(user: {
  id: string
  username?: string | null
  role?: string | null
}): Session {
  return {
    authed: true,
    login: user.username ?? null,
    userId: user.id,
    isAdmin: user.role === "admin",
  }
}

/** The first account is seeded with a login, not an email — hence `username`.
 * Returns the session it opened, so the caller doesn't re-fetch to learn the
 * role it just signed in with. */
export async function login(login: string, password: string): Promise<Session> {
  const { data, error } = await authClient().signIn.username({
    username: login,
    password,
  })
  if (error || !data) throw new Error(error?.message ?? "Invalid credentials")
  return toSession(data.user)
}

/** Signs in with the token a desktop browser sign-in ended with. */
export async function loginWithToken(token: string): Promise<Session> {
  runtime().auth.capture(token)
  const session = await fetchSession()
  if (!session.authed) {
    runtime().auth.clear()
    throw new Error("The server did not accept the sign-in")
  }
  return session
}

/** Drops this client's session: the cookie, and any token that was stored. */
export async function logout(): Promise<void> {
  await authClient().signOut()
  runtime().auth.clear()
}
