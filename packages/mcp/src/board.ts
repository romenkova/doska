import {
  CARD_GROUPS,
  COLUMN_GROUPS,
  type Card,
  type CardGroup,
  type Change,
  type Column,
  type ColumnGroup,
  type Dashboard,
  type DashboardChange,
} from "@doska/contract"
import { generateKeyBetween } from "fractional-indexing"
import type { BoardStore } from "./store"

type Record_ = { deletedAt: number | null }
type Ordered = { position: string }

const live = <T extends Record_>(record: T): boolean =>
  record.deletedAt === null

const byPosition = (a: Ordered, b: Ordered): number =>
  a.position < b.position ? -1 : a.position > b.position ? 1 : 0

/** 12 hex chars of a v4 uuid — the same id shape the clients mint. */
export const newId = (prefix: string): string =>
  `${prefix}-${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`

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

/**
 * A fractional index placing a record next to a named sibling. `siblings` must
 * not include the record being moved, so a move within a column doesn't try to
 * key against its own old position.
 */
export function positionNextTo<T extends Ordered & { id: string }>(
  siblings: T[],
  anchorId: string,
  side: "before" | "after"
): string {
  const sorted = [...siblings].sort(byPosition)
  const at = sorted.findIndex((s) => s.id === anchorId)
  if (at === -1) throw new Error(`No sibling ${anchorId} to place next to`)

  const [lower, upper] =
    side === "before"
      ? [sorted[at - 1]?.position ?? null, sorted[at].position]
      : [sorted[at].position, sorted[at + 1]?.position ?? null]
  return generateKeyBetween(lower, upper)
}

/**
 * Stamps a whole record as written at `now`. For dashboards, which merge as
 * one unit; cards and columns merge per field group, see `touchCard`.
 */
export const touch = <T extends Record_>(record: T, now: number): T => ({
  ...record,
  updatedAt: now,
})

/** Stamps a record as deleted. The tombstone syncs, so no peer resurrects it. */
export const tombstone = <T extends Record_>(record: T, now: number): T => ({
  ...record,
  updatedAt: now,
  deletedAt: now,
})

type Stamped<G extends string> = {
  updatedAt: number
  stamps: Partial<Record<G, number>>
}

// Untouched groups are pinned at the old updatedAt first: a missing stamp reads
// as updatedAt, so left missing they would ride up with the touched ones.
function touchGroups<G extends string, T extends Stamped<G>>(
  record: T,
  all: readonly G[],
  groups: readonly G[],
  at: number
): T {
  const stamps: Partial<Record<G, number>> = {}
  for (const group of all)
    stamps[group] = record.stamps[group] ?? record.updatedAt
  for (const group of groups) stamps[group] = at
  return { ...record, stamps, updatedAt: Math.max(record.updatedAt, at) }
}

/** Stamps only the groups a write changed, so it merges with concurrent
 * edits to the card's other fields instead of overwriting them. */
export const touchCard = (
  card: Card,
  groups: readonly CardGroup[],
  at: number
): Card => touchGroups(card, CARD_GROUPS, groups, at)

export const touchColumn = (
  column: Column,
  groups: readonly ColumnGroup[],
  at: number
): Column => touchGroups(column, COLUMN_GROUPS, groups, at)

export const tombstoneCard = (card: Card, at: number): Card =>
  touchCard({ ...card, deletedAt: at }, ["deleted"], at)

export const tombstoneColumn = (column: Column, at: number): Column =>
  touchColumn({ ...column, deletedAt: at }, ["deleted"], at)

/** The column whose cards count as finished, if the board has one. */
export const doneColumn = (columns: Column[]): Column | undefined =>
  columns.find((c) => c.done)

/** Where un-marking a card sends it: the board's leftmost unfinished column. */
export const openColumn = (columns: Column[]): Column | undefined =>
  columns.find((c) => !c.done)

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

    /** The clock every write on this board is stamped from. */
    now(): number {
      return store.now()
    },

    pushDashboards(changes: DashboardChange[]): Promise<void> {
      return store.pushDashboards(changes)
    },

    pushBoard(boardId: string, changes: Change[]): Promise<void> {
      return store.pushBoard(boardId, changes)
    },
  }
}
