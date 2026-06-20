import { CARDS_BY_COLUMN, idb } from "./idb"
import { BOARD_COLUMNS, cards as seedCards, seedDashboards } from "../seed"
import type { Card, Column, Dashboard } from "../types"

const CARDS = "cards"
const COLUMNS = "columns"
const DASHBOARDS = "dashboards"

/**
 * Populates the stores from the fixtures on an empty DB. Called once at page
 * load; a non-empty store is left untouched so an existing user keeps their data.
 */
export async function seed(): Promise<void> {
  if ((await idb.count(DASHBOARDS)) > 0) return
  await Promise.all([
    ...seedDashboards.map((d) => idb.set(DASHBOARDS, d.id, d)),
    ...BOARD_COLUMNS.map((c) => idb.set(COLUMNS, c.id, c)),
    ...seedCards.map((c) => idb.set(CARDS, c.id, c)),
  ])
}

/**
 * Tombstones a record instead of removing it: sets `deletedAt` and bumps
 * `updatedAt` (the last-writer-wins version). We never hard-delete, because a
 * removed row can't push its own deletion and would be re-created on the next
 * pull — see sync.ts. `live()` is what hides tombstones from the UI.
 */
function tombstone<T extends { deletedAt: number | null; updatedAt: number }>(
  record: T
): T {
  const now = Date.now()
  return { ...record, deletedAt: now, updatedAt: now }
}

export const db = {
  getCard(id: string): Promise<Card | undefined> {
    return idb.get<Card>(CARDS, id)
  },
  getCards(columnId?: string): Promise<Card[]> {
    return idb.getAll<Card>(
      CARDS,
      columnId
        ? { index: CARDS_BY_COLUMN, range: IDBKeyRange.only(columnId) }
        : undefined
    )
  },
  setCard(card: Card): Promise<void> {
    return idb.set(CARDS, card.id, card)
  },
  softDeleteCard(card: Card): Promise<void> {
    return idb.set(CARDS, card.id, tombstone(card))
  },
  getColumns(): Promise<Column[]> {
    return idb.getAll<Column>(COLUMNS)
  },
  setColumn(column: Column): Promise<void> {
    return idb.set(COLUMNS, column.id, column)
  },
  softDeleteColumn(column: Column): Promise<void> {
    return idb.set(COLUMNS, column.id, tombstone(column))
  },
  getDashboards(): Promise<Dashboard[]> {
    return idb.getAll<Dashboard>(DASHBOARDS)
  },
  setDashboard(dashboard: Dashboard): Promise<void> {
    return idb.set(DASHBOARDS, dashboard.id, dashboard)
  },
  softDeleteDashboard(dashboard: Dashboard): Promise<void> {
    return idb.set(DASHBOARDS, dashboard.id, tombstone(dashboard))
  },
}
