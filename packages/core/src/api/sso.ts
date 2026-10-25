import { authClient } from "./auth-client"
import { markSignedIn } from "./auth"
import { appFetch } from "./fetch"
import { apiUrl, isSyncConfigured } from "./server"

export type SsoProvider = { id: string; name: string }

export type SignInOptions = {
  providers: SsoProvider[]
  /** The server wants a session before the app shows anything. */
  authRequired: boolean
}

const NO_SERVER: SignInOptions = { providers: [], authRequired: false }

export async function fetchSignInOptions(): Promise<SignInOptions> {
  if (!isSyncConfigured()) return NO_SERVER
  const res = await appFetch(apiUrl("/api/sso"))
  if (!res.ok) return NO_SERVER
  const body = (await res.json()) as Partial<SignInOptions>
  return {
    providers: body.providers ?? [],
    authRequired: body.authRequired ?? false,
  }
}

/** Where to send the browser. It comes back at `callbackURL` signed in, or at
 * /sign-in with `?error=` when the provider said no. */
export async function ssoSignInUrl(
  providerId: string,
  callbackURL: string
): Promise<string> {
  markSignedIn()
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
