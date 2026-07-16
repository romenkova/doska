import { authClient } from "./auth-client"
import { isSyncConfigured } from "./server"
import { clearSessionToken } from "./session-token"

export type Session = { authed: boolean; login: string | null }

/** Resolves the current session against the server. */
export async function fetchSession(): Promise<Session> {
  if (!isSyncConfigured()) return { authed: false, login: null }
  try {
    const { data } = await authClient().getSession()
    if (!data) return { authed: false, login: null }
    return { authed: true, login: data.user.username ?? null }
  } catch {
    return { authed: false, login: null }
  }
}

/** The one account is seeded with a login, not an email — hence `username`. */
export async function login(login: string, password: string): Promise<void> {
  const { error } = await authClient().signIn.username({
    username: login,
    password,
  })
  if (error) throw new Error(error.message ?? "Invalid credentials")
}

/** Drops this client's session: the cookie on web, the stored token on desktop. */
export async function logout(): Promise<void> {
  await authClient().signOut()
  clearSessionToken()
}
