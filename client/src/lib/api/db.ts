import { cardContent, type Card } from "@/lib/card-data"
import {
  seedDashboards,
  type BoardItems,
  type Dashboard,
} from "@/lib/dashboards"
import { idbCount, idbDelete, idbGet, idbSet } from "./idb"

/**
 * The local store. Each card and each board is its own IndexedDB record, so a
 * write touches only what changed — editing one note rewrites one record, not the
 * whole dataset. The dashboards list (board metadata) is a single record. Seeded
 * once from the static fixtures. Reads/writes are local and effectively instant;
 * the slow "real" backend is only touched by `./sync`.
 */

const CARDS = "cards"
const BOARDS = "boards"
const DASHBOARDS = "dashboards"
/** The dashboards list is a single record under this key. */
const DASHBOARDS_KEY = "list"

let seedPromise: Promise<void> | null = null

/** Populates the stores from the fixtures on first run (once per session). */
function ensureSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = (async () => {
      // Cards + board arrangements: seed only on a truly empty store.
      if ((await idbCount(BOARDS)) === 0) {
        await Promise.all([
          ...seedDashboards.map((d) => idbSet(BOARDS, d.id, d.items)),
          ...Object.entries(cardContent).map(([id, card]) =>
            idbSet(CARDS, id, card)
          ),
        ])
      }
      // The dashboards list. Seeded separately so it's also populated when an
      // existing user upgrades from a schema that predates this store.
      if ((await idbCount(DASHBOARDS)) === 0) {
        await idbSet(
          DASHBOARDS,
          DASHBOARDS_KEY,
          seedDashboards.map((d) => ({
            id: d.id,
            name: d.name,
            columns: d.columns,
          }))
        )
      }
    })()
  }
  return seedPromise
}

export const db = {
  async getCard(id: string): Promise<Card | undefined> {
    await ensureSeeded()
    return idbGet<Card>(CARDS, id)
  },
  async setCard(id: string, card: Card): Promise<void> {
    await ensureSeeded()
    await idbSet(CARDS, id, card)
  },
  async deleteCard(id: string): Promise<void> {
    await ensureSeeded()
    await idbDelete(CARDS, id)
  },
  async getBoard(deckId: string): Promise<BoardItems | undefined> {
    await ensureSeeded()
    return idbGet<BoardItems>(BOARDS, deckId)
  },
  async setBoard(deckId: string, items: BoardItems): Promise<void> {
    await ensureSeeded()
    await idbSet(BOARDS, deckId, items)
  },
  async deleteBoard(deckId: string): Promise<void> {
    await ensureSeeded()
    await idbDelete(BOARDS, deckId)
  },
  async getDashboards(): Promise<Dashboard[] | undefined> {
    await ensureSeeded()
    return idbGet<Dashboard[]>(DASHBOARDS, DASHBOARDS_KEY)
  },
  async setDashboards(list: Dashboard[]): Promise<void> {
    await ensureSeeded()
    await idbSet(DASHBOARDS, DASHBOARDS_KEY, list)
  },
}
