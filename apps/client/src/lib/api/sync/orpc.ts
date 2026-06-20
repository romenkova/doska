import { contract } from "@deck/contract"
import { createORPCClient } from "@orpc/client"
import { RPCLink } from "@orpc/client/fetch"
import type { ContractRouterClient } from "@orpc/contract"

// Same-origin path; the Vite dev server proxies `/rpc` to the API (see vite.config).
const link = new RPCLink({ url: `${window.location.origin}/rpc` })

export const orpc: ContractRouterClient<typeof contract> =
  createORPCClient(link)
