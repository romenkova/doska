import { appFetch } from "./fetch"
import { apiUrl } from "./server"

export type DesktopLogin = { id: string; secret: string; url: string }

export async function startDesktopLogin(): Promise<DesktopLogin> {
  const res = await appFetch(apiUrl("/api/desktop-login"), { method: "POST" })
  if (!res.ok) throw new Error("Could not reach the server")
  const { id, secret, url } = (await res.json()) as DesktopLogin
  // Relative when the server has no BASE_URL: the page is then at the server.
  return { id, secret, url: url.startsWith("/") ? apiUrl(url) : url }
}

/** The browser side: hands its session to the app that asked. */
export async function completeDesktopLogin(id: string): Promise<void> {
  const res = await appFetch(apiUrl(`/api/desktop-login/${id}/complete`), {
    method: "POST",
  })
  if (res.status === 404)
    throw new Error("This sign-in has expired. Start again in the app.")
  if (!res.ok) throw new Error("Could not finish signing in")
}

/** The app side: null until the browser is done; throws once the attempt has
 * expired. */
export async function desktopLoginToken({
  id,
  secret,
}: DesktopLogin): Promise<string | null> {
  const res = await appFetch(apiUrl(`/api/desktop-login/${id}/token`), {
    method: "POST",
    headers: { "x-desktop-login-secret": secret },
  })
  if (!res.ok) throw new Error("This sign-in has expired. Try again.")
  const { token } = (await res.json()) as { token: string | null }
  return token
}
