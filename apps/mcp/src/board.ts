import type {
  Card,
  Change,
  Column,
  Dashboard,
  DashboardChange,
} from "@doska/contract"
import { generateKeyBetween } from "fractional-indexing"
import { orpc } from "./rpc"

/**
 * The board, expressed through the sync protocol — the server's only write
 * surface. Every call is push-then-pull:
 *
 *  - Reading is a push of nothing from `since: 0`, which hands back every record.
 *  - Writing is a push of whole records under last-writer-wins, so a create and
 *    an update are the same call, and a delete is a tombstone (`deletedAt` set)
 *    that propagates instead of leaving the record to reappear from a peer.
 */

/**
 * Every sync call pulls back whatever is past the `since` cursor we send, so we
 * keep the cursor each read hands us and send it on the next write to that
 * scope. A write from a cold process pulls the scope once and then stops.
 */
const cursors = new Map<string, number>()

type Record_ = { deletedAt: number | null }
type Ordered = { position: string }

const live = <T extends Record_>(r: T): boolean => r.deletedAt === null

const byPosition = (a: Ordered, b: Ordered): number =>
  a.position < b.position ? -1 : a.position > b.position ? 1 : 0

export const newId = (prefix: string): string =>
  `${prefix}-${crypto.randomUUID().slice(0, 8)}`

/** A fractional index placing a record at either end of its sorted siblings. */
export function positionAt(
  siblings: Ordered[],
  edge: "top" | "bottom"
): string {
  const sorted = [...siblings].sort(byPosition)
  return edge === "top"
    ? generateKeyBetween(null, sorted[0]?.position ?? null)
    : generateKeyBetween(sorted[sorted.length - 1]?.position ?? null, null)
}

const DASHBOARDS = "dashboards"

export async function readDashboards(): Promise<Dashboard[]> {
  const { cursor, changes } = await orpc.dashboards.sync({
    since: 0,
    changes: [],
  })
  cursors.set(DASHBOARDS, cursor)
  return changes
    .map((c) => c.record)
    .filter(live)
    .sort(byPosition)
}

export async function readDashboard(id: string): Promise<Dashboard> {
  const found = (await readDashboards()).find((d) => d.id === id)
  if (!found) throw new Error(`No board ${id}`)
  return found
}

export async function readBoard(
  boardId: string
): Promise<{ columns: Column[]; cards: Card[] }> {
  const { cursor, changes } = await orpc.board.sync({
    boardId,
    since: 0,
    changes: [],
  })
  cursors.set(boardId, cursor)

  const columns: Column[] = []
  const cards: Card[] = []
  for (const change of changes) {
    if (change.store === "columns") columns.push(change.record)
    if (change.store === "cards") cards.push(change.record)
  }

  return {
    columns: columns.filter(live).sort(byPosition),
    cards: cards.filter(live).sort(byPosition),
  }
}

export async function readColumn(
  boardId: string,
  columnId: string
): Promise<Column> {
  const found = (await readBoard(boardId)).columns.find(
    (c) => c.id === columnId
  )
  if (!found) throw new Error(`No column ${columnId} on board ${boardId}`)
  return found
}

export async function readCard(boardId: string, cardId: string): Promise<Card> {
  const found = (await readBoard(boardId)).cards.find((c) => c.id === cardId)
  if (!found) throw new Error(`No card ${cardId} on board ${boardId}`)
  return found
}

export async function pushBoard(
  boardId: string,
  changes: Change[]
): Promise<void> {
  const { cursor } = await orpc.board.sync({
    boardId,
    since: cursors.get(boardId) ?? 0,
    changes,
  })
  cursors.set(boardId, cursor)
}

export async function pushDashboards(
  changes: DashboardChange[]
): Promise<void> {
  const { cursor } = await orpc.dashboards.sync({
    since: cursors.get(DASHBOARDS) ?? 0,
    changes,
  })
  cursors.set(DASHBOARDS, cursor)
}

/** Stamps a record as written now. Its `updatedAt` is what settles a conflict. */
export const touch = <T extends Record_>(record: T): T => ({
  ...record,
  updatedAt: Date.now(),
})

/** Stamps a record as deleted now, keeping the tombstone the sync protocol wants. */
export const tombstone = <T extends Record_>(record: T): T => ({
  ...record,
  updatedAt: Date.now(),
  deletedAt: Date.now(),
})
