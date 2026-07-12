import { config } from "./config"

/**
 * Session handling for the sync API, which is cookie-authed: trade the
 * configured login/password for a cookie, then send it on every RPC.
 */

let cookie: string | null = null
let pending: Promise<string> | null = null

async function login(): Promise<string> {
  const res = await fetch(`${config.url}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ login: config.login, password: config.password }),
  })
  if (!res.ok) {
    throw new Error(
      `Login to ${config.url} failed (${res.status}). Check DOSKA_LOGIN and DOSKA_PASSWORD.`
    )
  }
  const jar = res.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ")
  if (!jar)
    throw new Error("Server accepted the login but set no session cookie")
  cookie = jar
  return jar
}

/** Concurrent tool calls on a cold start share one login instead of racing. */
function session(): Promise<string> {
  if (cookie) return Promise.resolve(cookie)
  pending ??= login().finally(() => {
    pending = null
  })
  return pending
}

/**
 * The oRPC transport. Mints the session on first use, and re-mints it once if
 * the server has expired the cookie out from under a long-lived process.
 */
export async function authedFetch(
  request: Request,
  init?: RequestInit
): Promise<Response> {
  const retry = request.clone()
  const res = await fetch(request, {
    ...init,
    headers: withCookie(request, await session()),
  })
  if (res.status !== 401) return res

  cookie = null
  return fetch(retry, {
    ...init,
    headers: withCookie(retry, await session()),
  })
}

function withCookie(request: Request, jar: string): Record<string, string> {
  return { ...Object.fromEntries(request.headers), cookie: jar }
}
