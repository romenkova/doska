import { createHash, randomBytes } from "node:crypto"
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

const REDIRECT_URI = "http://localhost/callback"

/**
 * A bearer token for `/mcp`, obtained the way a client does: dynamic
 * registration, then the PKCE authorization-code dance against `cookie`'s
 * session. Scoped to whoever that cookie signs in as.
 */
export async function mcpToken(h: Harness, cookie: string): Promise<string> {
  const registered = await h.app.inject({
    method: "POST",
    url: "/api/auth/mcp/register",
    headers: { "content-type": "application/json" },
    payload: JSON.stringify({
      client_name: "test client",
      redirect_uris: [REDIRECT_URI],
      grant_types: ["authorization_code"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
    }),
  })
  const clientId: string = registered.json().client_id

  const verifier = randomBytes(32).toString("base64url")
  const query = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    scope: "openid",
    code_challenge: createHash("sha256").update(verifier).digest("base64url"),
    code_challenge_method: "S256",
  })
  const authorized = await h.app.inject({
    method: "GET",
    url: `/api/auth/mcp/authorize?${query}`,
    headers: { cookie },
  })
  const code = new URL(authorized.headers.location as string).searchParams.get(
    "code"
  )

  const token = await h.app.inject({
    method: "POST",
    url: "/api/auth/mcp/token",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    payload: new URLSearchParams({
      grant_type: "authorization_code",
      code: code as string,
      redirect_uri: REDIRECT_URI,
      client_id: clientId,
      code_verifier: verifier,
    }).toString(),
  })
  return token.json().access_token
}

export interface ToolResult {
  content: { text: string }[]
  isError?: boolean
}

/** One `tools/call` over the stateless HTTP transport, as a client would send it. */
export async function callTool(
  h: Harness,
  token: string,
  name: string,
  args: Record<string, unknown> = {}
): Promise<ToolResult> {
  const res = await h.app.inject({
    method: "POST",
    url: "/mcp",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      authorization: `Bearer ${token}`,
    },
    payload: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: { name, arguments: args },
    }),
  })
  if (res.statusCode !== 200)
    throw new Error(`tools/call ${name} → ${res.statusCode}: ${res.payload}`)
  return JSON.parse(res.payload).result as ToolResult
}

/** The JSON a successful tool packs into its single text block. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toolJson(result: ToolResult): any {
  if (result.isError) throw new Error(result.content[0].text)
  return JSON.parse(result.content[0].text)
}

/** Clears the sync tables; leaves the auth tables (and thus the session) intact. */
export async function resetTables(): Promise<void> {
  await getDB().execute(
    sql`TRUNCATE cards, columns, dashboards, board_members, counters RESTART IDENTITY`
  )
}
