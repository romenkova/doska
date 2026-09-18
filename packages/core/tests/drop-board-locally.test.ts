import { beforeEach, describe, expect, it } from "vitest"
import {
  CARDS,
  COLUMNS,
  DASHBOARDS,
  META_STORE,
  type StoreName,
} from "../src/api/constants"
import { installMemoryRuntime, rows } from "./memory-runtime"

const board = (id: string) => ({ id, updatedAt: 1, deletedAt: null })
const column = (id: string, dashboardId: string) => ({
  id,
  dashboardId,
  updatedAt: 1,
  deletedAt: null,
})
const card = (id: string, columnId: string) => ({
  id,
  columnId,
  updatedAt: 1,
  deletedAt: null,
})

/** Two boards, so the drop has something it must leave alone. */
function seedBoards() {
  rows.set(`${DASHBOARDS}/gone`, board("gone"))
  rows.set(`${COLUMNS}/col-gone`, column("col-gone", "gone"))
  rows.set(`${CARDS}/card-gone`, card("card-gone", "col-gone"))
  rows.set(`${META_STORE}/cursor:gone`, 42)

  rows.set(`${DASHBOARDS}/mine`, board("mine"))
  rows.set(`${COLUMNS}/col-mine`, column("col-mine", "mine"))
  rows.set(`${CARDS}/card-mine`, card("card-mine", "col-mine"))
  rows.set(`${META_STORE}/cursor:mine`, 7)
}

const keysIn = (store: string) =>
  [...rows.keys()]
    .filter((composite) => composite.startsWith(`${store}/`))
    .map((composite) => composite.slice(store.length + 1))
    .sort()

beforeEach(installMemoryRuntime)

/** The engine's own `dropDirty`, which the drop now takes as an argument.
 * Imported as late as the module under test, since the engine reads the runtime
 * as it is constructed. */
async function loadDropDirty() {
  const { sync } = await import("../src/api/sync/sync-engine")
  return (store: StoreName, ids: string[]) => sync.dropDirty(store, ids)
}

describe("dropBoardLocally", () => {
  it("removes the board's row, contents and cursor, and nothing else", async () => {
    seedBoards()

    const dropDirty = await loadDropDirty()
    const { dropBoardLocally } =
      await import("../src/api/operations/drop-board-locally")
    await dropBoardLocally("gone", dropDirty)

    expect(keysIn(DASHBOARDS)).toEqual(["mine"])
    expect(keysIn(COLUMNS)).toEqual(["col-mine"])
    expect(keysIn(CARDS)).toEqual(["card-mine"])
    expect(keysIn(META_STORE)).toEqual(["cursor:mine"])
  })

  // The regression that matters: a ref that can never be acked keeps `pending`
  // off zero forever, so the app claims unsaved work it cannot save.
  it("leaves pending at zero when the board had unpushed edits", async () => {
    seedBoards()

    const { sync } = await import("../src/api/sync/sync-engine")
    sync.markDirty(DASHBOARDS, "gone")
    sync.markDirty(COLUMNS, "col-gone")
    sync.markDirty(CARDS, "card-gone")
    expect(sync.getState().pending).toBe(3)

    const { dropBoardLocally } =
      await import("../src/api/operations/drop-board-locally")
    await dropBoardLocally("gone", (store, ids) => sync.dropDirty(store, ids))

    expect(sync.getState().pending).toBe(0)
  })

  it("keeps another board's pending edits", async () => {
    seedBoards()

    const { sync } = await import("../src/api/sync/sync-engine")
    sync.markDirty(CARDS, "card-gone")
    sync.markDirty(CARDS, "card-mine")

    const { dropBoardLocally } =
      await import("../src/api/operations/drop-board-locally")
    await dropBoardLocally("gone", (store, ids) => sync.dropDirty(store, ids))

    expect(sync.isDirty(CARDS, "card-mine")).toBe(true)
    expect(sync.getState().pending).toBe(1)
  })
})
