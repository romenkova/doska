import type {
  Card,
  Change,
  Column,
  Dashboard,
  DashboardChange,
} from "@doska/contract"
import { generateKeyBetween } from "fractional-indexing"
import type { BoardStore } from "./store"

type Record_ = { deletedAt: number | null }
type Ordered = { position: string }

const live = <T extends Record_>(record: T): boolean =>
  record.deletedAt === null

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

/** Stamps a record as written now. Its `updatedAt` is what settles a conflict. */
export const touch = <T extends Record_>(record: T): T => ({
  ...record,
  updatedAt: Date.now(),
})

/** Stamps a record as deleted. The tombstone syncs, so no peer resurrects it. */
export const tombstone = <T extends Record_>(record: T): T => ({
  ...record,
  updatedAt: Date.now(),
  deletedAt: Date.now(),
})

export type Board = ReturnType<typeof createBoard>

/**
 * The board the tools work against: a store, plus the reading a store doesn't
 * do — tombstones dropped, records in their board order, and the lookups that
 * turn a missing id into an error a client can act on.
 */
export function createBoard(store: BoardStore) {
  return {
    async dashboards(): Promise<Dashboard[]> {
      const dashboards = await store.readDashboards()
      return dashboards.filter(live).sort(byPosition)
    },

    async dashboard(id: string): Promise<Dashboard> {
      const found = (await this.dashboards()).find((d) => d.id === id)
      if (!found) throw new Error(`No board ${id}`)
      return found
    },

    async board(boardId: string): Promise<{
      columns: Column[]
      cards: Card[]
    }> {
      const columns: Column[] = []
      const cards: Card[] = []
      for (const change of await store.readBoard(boardId)) {
        if (change.store === "columns") columns.push(change.record)
        if (change.store === "cards") cards.push(change.record)
      }
      return {
        columns: columns.filter(live).sort(byPosition),
        cards: cards.filter(live).sort(byPosition),
      }
    },

    async column(boardId: string, columnId: string): Promise<Column> {
      const found = (await this.board(boardId)).columns.find(
        (c) => c.id === columnId
      )
      if (!found) throw new Error(`No column ${columnId} on board ${boardId}`)
      return found
    },

    async card(boardId: string, cardId: string): Promise<Card> {
      const found = (await this.board(boardId)).cards.find(
        (c) => c.id === cardId
      )
      if (!found) throw new Error(`No card ${cardId} on board ${boardId}`)
      return found
    },

    pushDashboards(changes: DashboardChange[]): Promise<void> {
      return store.pushDashboards(changes)
    },

    pushBoard(boardId: string, changes: Change[]): Promise<void> {
      return store.pushBoard(boardId, changes)
    },
  }
}
