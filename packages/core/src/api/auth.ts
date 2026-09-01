import { runtime } from "../runtime"
import { authClient } from "./auth-client"
import { appFetch } from "./fetch"
import { apiUrl, isSyncConfigured } from "./server"

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

/** Drops this client's session: the cookie, and any token that was stored. */
export async function logout(): Promise<void> {
  await authClient().signOut()
  runtime().auth.clear()
}

export type SsoProvider = { id: string; name: string }

/** Identity providers the server signs people in through, besides a password. */
export async function fetchSsoProviders(): Promise<SsoProvider[]> {
  if (!isSyncConfigured()) return []
  const res = await appFetch(apiUrl("/api/sso"))
  if (!res.ok) return []
  const body = (await res.json()) as { providers?: SsoProvider[] }
  return body.providers ?? []
}

/**
 * Where to send the browser to sign in through a provider. It comes back at
 * `callbackURL` with a session, or at /sign-in with `?error=` when the provider
 * said no.
 */
export async function ssoSignInUrl(
  providerId: string,
  callbackURL: string
): Promise<string> {
  const { data, error } = await authClient().signIn.oauth2({
    providerId,
    callbackURL,
    errorCallbackURL: "/sign-in",
    disableRedirect: true,
  })
  if (error || !data?.url)
    throw new Error(error?.message ?? "Could not start sign-in")
  return data.url
}

/** The same round trip for an account already signed in: from then on the
 * provider's identity opens this account. */
export async function ssoLinkUrl(
  providerId: string,
  callbackURL: string
): Promise<string> {
  const { data, error } = await authClient().oauth2.link({
    providerId,
    callbackURL,
    errorCallbackURL: callbackURL,
  })
  if (error || !data?.url)
    throw new Error(error?.message ?? "Could not start connecting")
  return data.url
}

/** Provider ids connected to the signed-in account. */
export async function fetchLinkedProviders(): Promise<string[]> {
  const { data, error } = await authClient().listAccounts()
  if (error || !data)
    throw new Error(error?.message ?? "Could not load sign-in methods")
  return data.map((account) => account.providerId)
}
