import { contract } from "@doska/contract"
import { createORPCClient } from "@orpc/client"
import { RPCLink } from "@orpc/client/fetch"
import type { ContractRouterClient } from "@orpc/contract"
import { appFetch } from "../fetch"
import { apiUrl } from "../server"

// Web: same-origin path proxied to the API (see vite.config). Desktop: the
// user's configured server URL, fetched via Tauri's HTTP plugin (see fetch).
const link = new RPCLink({
  // Resolved per request: the desktop server URL can be set after load.
  url: () => apiUrl("/api/rpc"),
  fetch: async (request, init) => {
    const res = await appFetch(request, {
      ...init,
      credentials: "include",
    })
    // Session missing or expired: let the auth store flip to signed-out so the
    // UI prompts a re-login.
    if (res.status === 401) window.dispatchEvent(new Event("auth:expired"))
    return res
  },
})

export const orpc: ContractRouterClient<typeof contract> =
  createORPCClient(link)
