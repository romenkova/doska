import { createHash, randomBytes } from "node:crypto"
import { config } from "./config"

const CLIENT_ID = "doska-native"

const s256 = (verifier: string) =>
  createHash("sha256").update(verifier).digest("base64url")

type Tokens = { access: string; refresh?: string }

let tokens: Tokens | null = null
let pending: Promise<Tokens> | null = null

async function authorize(): Promise<Tokens> {
  const verifier = randomBytes(32).toString("base64url")
  const redirectUri = `${config.url}/oauth/native`

  // The authorization redirects to `/oauth/native`, which hands the code back
  // as JSON — so following the redirect is all it takes to collect it.
  const res = await fetch(`${config.url}/oauth/authorize`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      response_type: "code",
      client_id: CLIENT_ID,
      redirect_uri: redirectUri,
      code_challenge: s256(verifier),
      code_challenge_method: "S256",
      resource: config.url,
      login: config.login,
      password: config.password,
    }),
  })
  if (!res.ok) {
    throw new Error(
      `Sign-in to ${config.url} failed (${res.status}). Check DOSKA_LOGIN and DOSKA_PASSWORD.`
    )
  }

  const { code } = (await res.json()) as { code?: string }
  if (!code) throw new Error("Authorization returned no code")

  return exchange({
    grant_type: "authorization_code",
    client_id: CLIENT_ID,
    redirect_uri: redirectUri,
    code_verifier: verifier,
    code,
  })
}

async function exchange(params: Record<string, string>): Promise<Tokens> {
  const res = await fetch(`${config.url}/oauth/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params),
  })
  if (!res.ok) throw new Error(`Token request failed (${res.status})`)

  const body = (await res.json()) as {
    access_token?: string
    refresh_token?: string
  }
  if (!body.access_token) throw new Error("Server returned no access token")
  return { access: body.access_token, refresh: body.refresh_token }
}

/** Concurrent tool calls on a cold start share one sign-in instead of racing. */
function session(): Promise<Tokens> {
  if (tokens) return Promise.resolve(tokens)
  pending ??= authorize()
    .then((minted) => (tokens = minted))
    .finally(() => {
      pending = null
    })
  return pending
}

/** Access tokens are short-lived; spend the refresh token before re-authorizing. */
async function renew(): Promise<Tokens> {
  const refresh = tokens?.refresh
  tokens = null
  if (!refresh) return session()
  try {
    tokens = await exchange({
      grant_type: "refresh_token",
      client_id: CLIENT_ID,
      refresh_token: refresh,
    })
    return tokens
  } catch {
    return session()
  }
}

/** The oRPC transport: signs in on first use, renews once when a token expires. */
export async function authedFetch(
  request: Request,
  init?: RequestInit
): Promise<Response> {
  const retry = request.clone()
  const res = await fetch(request, {
    ...init,
    headers: withToken(request, (await session()).access),
  })
  if (res.status !== 401) return res

  return fetch(retry, {
    ...init,
    headers: withToken(retry, (await renew()).access),
  })
}

function withToken(request: Request, access: string): Record<string, string> {
  return {
    ...Object.fromEntries(request.headers),
    authorization: `Bearer ${access}`,
  }
}
