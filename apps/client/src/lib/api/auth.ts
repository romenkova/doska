/**
 * Raw auth endpoints for the sync session. These are the transport only — React
 * Query owns the session state (see `lib/data/queries` and `lib/data/mutations`).
 *
 * Auth gates sync alone; the board is fully usable offline either way.
 */

import { apiUrl, appFetch, getSyncTarget, isSyncConfigured } from "./runtime"

/** `login` names the session (the configured login) while authed, else `null`. */
export type Session = { authed: boolean; login: string | null }

/** Resolves the current session against the server. Network errors read as signed-out. */
export async function fetchSession(): Promise<Session> {
  // A session is a *server* concept. The folder backend has no account, and
  // desktop with no server configured has nowhere to ask — both are session-less.
  if (getSyncTarget() !== "server" || !isSyncConfigured())
    return { authed: false, login: null }
  try {
    const res = await appFetch(apiUrl("/api/auth/me"), { credentials: "include" })
    const body = (await res.json()) as { authed?: boolean; login?: string }
    return { authed: Boolean(body.authed), login: body.login ?? null }
  } catch {
    return { authed: false, login: null }
  }
}

/** Trades credentials for a session cookie; throws on rejection so the mutation surfaces it. */
export async function login(login: string, password: string): Promise<void> {
  const res = await appFetch(apiUrl("/api/auth/login"), {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ login, password }),
  })
  if (!res.ok) throw new Error("Invalid credentials")
}

/** Clears the session cookie. Local data and editing are unaffected. */
export async function logout(): Promise<void> {
  await appFetch(apiUrl("/api/auth/logout"), {
    method: "POST",
    credentials: "include",
  })
}
