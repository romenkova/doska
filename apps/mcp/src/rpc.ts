import { contract } from "@doska/contract"
import { createORPCClient } from "@orpc/client"
import { RPCLink } from "@orpc/client/fetch"
import type { ContractRouterClient } from "@orpc/contract"
import { config } from "./config"
import { authedFetch } from "./session"

const link = new RPCLink({
  url: `${config.url}/api/rpc`,
  fetch: authedFetch,
})

export const orpc: ContractRouterClient<typeof contract> =
  createORPCClient(link)
