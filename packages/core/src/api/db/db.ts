import { runtime } from "../../runtime"
import { cards as seedCards, seedColumns, seedDashboards } from "../../seed"
import type { Card, Column, Dashboard, SidebarLayout } from "../../types"
import {
  CARDS,
  CARDS_BY_COLUMN,
  CARDS_BY_DEADLINE,
  CARDS_BY_NUMBER,
  COLUMNS,
  DASHBOARDS,
  SIDEBAR,
  SIDEBAR_LAYOUT_ID,
  type StoreName,
} from "../constants"
import { stamp } from "../sync/hlc"

/**
 * Populates the stores from the fixtures on an empty DB. Called once at page
 * load; a non-empty store is left untouched so an existing user keeps their data.
 */
export async function seed(): Promise<void> {
  if ((await runtime().db.count(DASHBOARDS)) > 0) return
  await Promise.all([
    ...seedDashboards.map((d) => runtime().db.set(DASHBOARDS, d.id, d)),
    ...seedColumns.map((c) => runtime().db.set(COLUMNS, c.id, c)),
    ...seedCards.map((c) => runtime().db.set(CARDS, c.id, c)),
  ])
}

/**
 * Tombstones a record instead of removing it: sets `deletedAt` and bumps
 * `updatedAt` (the last-writer-wins version). We never hard-delete, because a
 * removed row can't push its own deletion and would be re-created on the next
 * pull — see sync.ts. `live()` is what hides tombstones from the UI. The
 * tombstone stays put until it ages out of the trash (see `purgeExpired`).
 */
function tombstone<T extends { deletedAt: number | null; updatedAt: number }>(
  record: T
): T {
  const now = stamp()
  return { ...record, deletedAt: now, updatedAt: now }
}

/** Clears a tombstone and bumps `updatedAt`, so the revival wins LWW. */
function revive<T extends { deletedAt: number | null; updatedAt: number }>(
  record: T
): T {
  return { ...record, deletedAt: null, updatedAt: stamp() }
}

export const db = {
  getCard(id: string): Promise<Card | undefined> {
    return runtime().db.get<Card>(CARDS, id)
  },
  getCards(columnId?: string): Promise<Card[]> {
    return runtime().db.getAll<Card>(
      CARDS,
      columnId
        ? {
            index: CARDS_BY_COLUMN,
            range: { lower: columnId, upper: columnId },
          }
        : undefined
    )
  },
  getCardsByNumber(num?: number): Promise<Card[]> {
    return runtime().db.getAll<Card>(
      CARDS,
      num
        ? {
            index: CARDS_BY_NUMBER,
            range: { lower: num, upper: num },
          }
        : undefined
    )
  },
  /** Cards deadlined within `[from, to]` (inclusive `YYYY-MM-DD` bounds), in
   * date order. Spans every board — the index is global. */
  getCardsByDeadline(from: string, to: string): Promise<Card[]> {
    return runtime().db.getAll<Card>(CARDS, {
      index: CARDS_BY_DEADLINE,
      range: { lower: from, upper: to },
    })
  },
  setCard(card: Card): Promise<void> {
    return runtime().db.set(CARDS, card.id, card)
  },
  softDeleteCard(card: Card): Promise<void> {
    return runtime().db.set(CARDS, card.id, tombstone(card))
  },
  restoreCard(card: Card): Promise<void> {
    return runtime().db.set(CARDS, card.id, revive(card))
  },
  getColumn(id: string): Promise<Column | undefined> {
    return runtime().db.get<Column>(COLUMNS, id)
  },
  getColumns(): Promise<Column[]> {
    return runtime().db.getAll<Column>(COLUMNS)
  },
  setColumn(column: Column): Promise<void> {
    return runtime().db.set(COLUMNS, column.id, column)
  },
  softDeleteColumn(column: Column): Promise<void> {
    return runtime().db.set(COLUMNS, column.id, tombstone(column))
  },
  restoreColumn(column: Column): Promise<void> {
    return runtime().db.set(COLUMNS, column.id, revive(column))
  },
  getDashboard(id: string): Promise<Dashboard | undefined> {
    return runtime().db.get<Dashboard>(DASHBOARDS, id)
  },
  getDashboards(): Promise<Dashboard[]> {
    return runtime().db.getAll<Dashboard>(DASHBOARDS)
  },
  setDashboard(dashboard: Dashboard): Promise<void> {
    return runtime().db.set(DASHBOARDS, dashboard.id, dashboard)
  },
  softDeleteDashboard(dashboard: Dashboard): Promise<void> {
    return runtime().db.set(DASHBOARDS, dashboard.id, tombstone(dashboard))
  },
  restoreDashboard(dashboard: Dashboard): Promise<void> {
    return runtime().db.set(DASHBOARDS, dashboard.id, revive(dashboard))
  },
  /** The account's sidebar layout; an empty one until the first edit. */
  async getSidebarLayout(): Promise<SidebarLayout> {
    const layout = await runtime().db.get<SidebarLayout>(
      SIDEBAR,
      SIDEBAR_LAYOUT_ID
    )
    return (
      layout ?? {
        id: SIDEBAR_LAYOUT_ID,
        items: [],
        updatedAt: 0,
        deletedAt: null,
      }
    )
  },
  setSidebarLayout(layout: SidebarLayout): Promise<void> {
    return runtime().db.set(SIDEBAR, SIDEBAR_LAYOUT_ID, layout)
  },
  /** Removes a record outright. Only for tombstones past retention. */
  hardDelete(store: StoreName, id: string): Promise<void> {
    return runtime().db.delete(store, id)
  },
}
