import { contract } from "@doska/contract"
import { createORPCClient } from "@orpc/client"
import { RPCLink } from "@orpc/client/fetch"
import type { ContractRouterClient } from "@orpc/contract"

// Same-origin path; the Vite dev server proxies `/rpc` to the API (see vite.config).
const link = new RPCLink({
  url: `${window.location.origin}/rpc`,
  fetch: async (request, init) => {
    const res = await globalThis.fetch(request, {
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
