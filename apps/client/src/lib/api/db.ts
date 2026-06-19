import { idbCount, idbDelete, idbGet, idbGetAll, idbSet } from "./idb"
import { BOARD_COLUMNS, cards as seedCards, seedDashboards } from "../seed"
import type { Card, Column, Dashboard } from "../types"

const CARDS = "cards"
const COLUMNS = "columns"
const DASHBOARDS = "dashboards"

let seedPromise: Promise<void> | null = null

/** Populates the stores from the fixtures on first run (once per session). */
function ensureSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = (async () => {
      // Seed only on a truly empty store, so an existing user keeps their data.
      if ((await idbCount(DASHBOARDS)) > 0) return
      await Promise.all([
        ...seedDashboards.map((d) => idbSet(DASHBOARDS, d.id, d)),
        ...BOARD_COLUMNS.map((c) => idbSet(COLUMNS, c.id, c)),
        ...seedCards.map((c) => idbSet(CARDS, c.id, c)),
      ])
    })()
  }
  return seedPromise
}

export const db = {
  async getCard(id: string): Promise<Card | undefined> {
    await ensureSeeded()
    return idbGet<Card>(CARDS, id)
  },
  async getCards(): Promise<Card[]> {
    await ensureSeeded()
    return idbGetAll<Card>(CARDS)
  },
  async setCard(card: Card): Promise<void> {
    await ensureSeeded()
    await idbSet(CARDS, card.id, card)
  },
  async deleteCard(id: string): Promise<void> {
    await ensureSeeded()
    await idbDelete(CARDS, id)
  },
  async getColumns(): Promise<Column[]> {
    await ensureSeeded()
    return idbGetAll<Column>(COLUMNS)
  },
  async setColumn(column: Column): Promise<void> {
    await ensureSeeded()
    await idbSet(COLUMNS, column.id, column)
  },
  async deleteColumn(id: string): Promise<void> {
    await ensureSeeded()
    await idbDelete(COLUMNS, id)
  },
  async getDashboards(): Promise<Dashboard[]> {
    await ensureSeeded()
    return idbGetAll<Dashboard>(DASHBOARDS)
  },
  async setDashboard(dashboard: Dashboard): Promise<void> {
    await ensureSeeded()
    await idbSet(DASHBOARDS, dashboard.id, dashboard)
  },
  async deleteDashboard(id: string): Promise<void> {
    await ensureSeeded()
    await idbDelete(DASHBOARDS, id)
  },
}
