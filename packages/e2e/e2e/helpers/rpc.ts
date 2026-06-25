import type { APIRequestContext } from "@playwright/test"
import type { Change, DashboardChange } from "@doska/contract"

/* -------------------------------------------------------------------------- */
/*  Second-client RPC layer. These talk to the real backend straight over     */
/*  `/rpc`, standing in for another device/teammate so the open page has to    */
/*  reconcile a change it never made. Entity helpers build on these; specs     */
/*  speak in titles and column names, and the wire envelope stays in here.     */
/* -------------------------------------------------------------------------- */

/**
 * Calls the per-board sync RPC. oRPC wraps payloads in a `{ json }` envelope on
 * the wire; this hides that. The relative URL resolves against the config
 * baseURL, which proxies `/rpc` to the e2e sync server.
 */
export async function sync(
  request: APIRequestContext,
  body: { boardId: string; since: number; changes: Change[] }
): Promise<{ cursor: number; changes: Change[] }> {
  const res = await request.post("/rpc/board/sync", { data: { json: body } })
  if (!res.ok())
    throw new Error(`sync failed (${res.status()}): ${await res.text()}`)
  const payload = (await res.json()) as {
    json: { cursor: number; changes: Change[] }
  }
  return payload.json
}

/**
 * Calls the dashboard-list sync RPC — the board-independent channel that carries
 * the dashboard list. Same `{ json }` envelope as the board channel.
 */
export async function dashboardSync(
  request: APIRequestContext,
  body: { since: number; changes: DashboardChange[] }
): Promise<{ cursor: number; changes: DashboardChange[] }> {
  const res = await request.post("/rpc/dashboards/sync", {
    data: { json: body },
  })
  if (!res.ok())
    throw new Error(`dashboard sync failed (${res.status()}): ${await res.text()}`)
  const payload = (await res.json()) as {
    json: { cursor: number; changes: DashboardChange[] }
  }
  return payload.json
}

/**
 * Polls the server until a change the open page pushed shows up, then returns
 * it. Lets a test reference "the card titled X" or "the To Do column" without
 * waiting on or knowing about the client's push timing.
 */
export async function waitForChange<S extends Change["store"]>(
  request: APIRequestContext,
  boardId: string,
  store: S,
  title: string,
  timeoutMs = 8000
): Promise<Extract<Change, { store: S }>> {
  const deadline = Date.now() + timeoutMs
  for (;;) {
    const { changes } = await sync(request, { boardId, since: 0, changes: [] })
    const hit = changes.find(
      (c): c is Extract<Change, { store: S }> =>
        c.store === store && c.record.title === title
    )
    if (hit) return hit
    if (Date.now() > deadline)
      throw new Error(`timed out waiting for ${store} "${title}" on the server`)
    await new Promise((r) => setTimeout(r, 150))
  }
}
