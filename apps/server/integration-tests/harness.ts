import { contract } from "@doska/contract"
import { createORPCClient } from "@orpc/client"
import { RPCLink } from "@orpc/client/fetch"
import type { ContractRouterClient } from "@orpc/contract"
import { sql } from "drizzle-orm"
import type { FastifyInstance, InjectOptions } from "fastify"
import { buildApp } from "../src/app"
import { auth } from "../src/auth"
import { getDB } from "../src/db/get-db"
import { seedAccount } from "../src/auth/seed"
import { runMigrations } from "../src/db/utils/run-migrations"
import type { ServerStorage } from "../src/routes/files"

export interface Harness {
  app: FastifyInstance
  /** A signed-in session cookie header, for `inject` calls to protected routes. */
  cookie: string
}

export type RpcClient = ContractRouterClient<typeof contract>

/**
 * Migrates a fresh in-memory DB, seeds the one account and signs it in. Call in
 * `beforeAll`; pair with `resetTables` in `beforeEach` to clear domain rows
 * between tests (the account/session survive so the cookie stays valid).
 */
export async function startServer(
  storage?: ServerStorage | null
): Promise<Harness> {
  await runMigrations()
  await seedAccount()

  const res = await auth.api.signInUsername({
    body: {
      username: process.env.AUTH_LOGIN ?? "tester",
      password: process.env.AUTH_PASSWORD ?? "test-password",
    },
    asResponse: true,
  })
  const cookie = res.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ")

  return { app: buildApp({ storage }), cookie }
}

/**
 * A real oRPC client wired to drive the server through `app.inject` — no socket.
 * Tests call `client.board.sync(...)` and are pinned to the contract alone: the
 * handler and everything under it can be renamed or restructured freely.
 */
export function rpcClient(h: Harness): RpcClient {
  const link = new RPCLink({
    url: "http://server/api/rpc",
    fetch: (async (request: Request) => {
      const url = new URL(request.url)
      const method = request.method as InjectOptions["method"]
      const payload =
        request.method === "GET" || request.method === "HEAD"
          ? undefined
          : Buffer.from(await request.arrayBuffer())

      const headers: Record<string, string> = { cookie: h.cookie }
      request.headers.forEach((value, key) => {
        headers[key] = value
      })

      const res = await h.app.inject({
        method,
        url: url.pathname + url.search,
        headers,
        payload,
      })

      const out = new Headers()
      for (const [key, value] of Object.entries(res.headers)) {
        if (typeof value === "string") out.set(key, value)
      }
      return new Response(res.rawPayload, { status: res.statusCode, headers: out })
    }) as typeof fetch,
  })
  return createORPCClient(link)
}

/** Clears the sync tables; leaves the auth tables (and thus the session) intact. */
export async function resetTables(): Promise<void> {
  await getDB().execute(
    sql`TRUNCATE cards, columns, dashboards, counters RESTART IDENTITY`
  )
}
