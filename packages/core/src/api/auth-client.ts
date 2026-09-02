/**
 * The better-auth client the app signs in with.
 */

import { createAuthClient } from "better-auth/react"
import {
  adminClient,
  genericOAuthClient,
  usernameClient,
} from "better-auth/client/plugins"
import { runtime } from "../runtime"
import { rawFetch } from "./fetch"
import { apiUrl } from "./server"

function create(baseURL: string) {
  return createAuthClient({
    baseURL,
    plugins: [usernameClient(), adminClient(), genericOAuthClient()],
    fetchOptions: {
      customFetchImpl: rawFetch,
      credentials: "include",
      auth: {
        type: "Bearer",
        token: () => runtime().auth.token() ?? undefined,
      },
      onSuccess: ({ response }) => {
        const token = response.headers.get("set-auth-token")
        if (token) runtime().auth.capture(token)
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
