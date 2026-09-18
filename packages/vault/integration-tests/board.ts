import type { Card, Column, Dashboard } from "@doska/contract"
import type { KeyRange } from "@doska/ports"
import { installRuntime, type Runtime } from "@doska/core/runtime"
import type { VaultBoard } from "../src/vault"

export const BOARD_ID = "board-1"

type Row = Record<string, unknown>

/**
 * The `ClientDB` under `@doska/core`, in memory, honouring the cards-by-column
 * index the operations seek on. Everything above it is the app's real code.
 */
class Rows {
  private readonly rows = new Map<string, Row>()

  private inStore(store: string): Row[] {
    return [...this.rows.entries()]
      .filter(([composite]) => composite.startsWith(`${store}/`))
      .map(([, row]) => row)
  }

  get(store: string, key: string) {
    return Promise.resolve(this.rows.get(`${store}/${key}`))
  }

  getAll(store: string, query?: { index: string; range: KeyRange }) {
    const all = this.inStore(store)
    if (!query) return Promise.resolve(all)
    return Promise.resolve(
      all.filter((row) => row[query.index] === query.range.lower)
    )
  }

  set(store: string, key: string, value: unknown) {
    this.rows.set(`${store}/${key}`, value as Row)
    return Promise.resolve()
  }

  delete(store: string, key: string) {
    this.rows.delete(`${store}/${key}`)
    return Promise.resolve()
  }

  count(store: string) {
    return Promise.resolve(this.inStore(store).length)
  }
}

const kv = new Map<string, string>()

/** The board's operations, plus a reader for what they left behind. */
export interface TestBoard extends VaultBoard {
  cards(): Promise<Card[]>
}

/**
 * Installs the runtime, puts one board with `columns` in it, and hands back the
 * real operations over it: the wiring `useVault` gives the vault in the app.
 * No server is configured, so the sync engines stay paused and nothing reaches
 * the wire.
 *
 * The operations are imported here rather than at the top of the file because
 * the sync engine reads the runtime as it is constructed, which happens the
 * moment the module loads.
 */
export async function installBoard(columns: Column[]): Promise<TestBoard> {
  const rows = new Rows()
  kv.clear()
  installRuntime({
    db: rows,
    kv: {
      get: (key: string) => kv.get(key) ?? null,
      set: (key: string, value: string) => void kv.set(key, value),
      remove: (key: string) => void kv.delete(key),
    },
    net: { online: () => true, subscribe: () => () => {} },
    http: { isConfigured: () => false, subscribe: () => () => {} },
  } as unknown as Runtime)

  const dashboard: Dashboard = {
    id: BOARD_ID,
    title: "Board",
    position: "a0",
    sort: [],
    updatedAt: 1,
    deletedAt: null,
  }
  await rows.set("dashboards", dashboard.id, dashboard)
  for (const column of columns) await rows.set("columns", column.id, column)

  const {
    createCard,
    deleteCard,
    createColumn,
    getBoard,
    getDeletedIds,
    moveCardToColumn,
    renameColumn,
    restore,
    updateCard,
  } = await import("@doska/core/operations")

  return {
    load: () => getBoard(BOARD_ID),
    createCard,
    createColumn: (title: string) => createColumn(BOARD_ID, title),
    updateCard,
    moveCardToColumn: async (id: string, columnId: string) => {
      await moveCardToColumn(id, columnId)
    },
    renameColumn,
    deleteCard: (id) => deleteCard(BOARD_ID, id),
    restoreCard: (id: string) => restore("cards", id),
    deleted: () => getDeletedIds(BOARD_ID),
    cards: async () => (await getBoard(BOARD_ID)).cards,
  }
}

export function makeColumn(
  id: string,
  title: string,
  position: string
): Column {
  return {
    id,
    title,
    position,
    dashboardId: BOARD_ID,
    collapsed: false,
    color: "",
    done: false,
    updatedAt: 1,
    deletedAt: null,
    stamps: {},
  }
}
