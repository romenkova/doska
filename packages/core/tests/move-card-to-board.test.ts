import { beforeEach, describe, expect, it } from "vitest"
import { CARDS, COLUMNS, DASHBOARDS } from "../src/api/constants"
import type { Card } from "../src/types"
import { installMemoryRuntime, rows } from "./memory-runtime"

const column = (
  id: string,
  dashboardId: string,
  position: string,
  deletedAt: number | null = null
) => ({ id, dashboardId, position, updatedAt: 1, deletedAt })
const attachment = { id: "att", name: "a.png", key: "att/1", mime: "", size: 1 }
const board = (id: string) => ({ id, title: id, updatedAt: 1, deletedAt: null })
const card = (id: string, columnId: string, position: string) => ({
  id,
  columnId,
  position,
  title: id,
  body: "notes",
  number: 4,
  attachments: [attachment],
  updatedAt: 1,
  deletedAt: null,
})

const stored = (id: string) => rows.get(`${CARDS}/${id}`) as Card
const liveIn = (columnId: string) =>
  [...rows.values()].filter(
    (r) => (r as Card).columnId === columnId && (r as Card).deletedAt === null
  ) as Card[]

beforeEach(installMemoryRuntime)

describe("moveCardToBoard", () => {
  it("copies the card to the top of the target board's first live column and tombstones the original", async () => {
    rows.set(`${DASHBOARDS}/from`, board("from"))
    rows.set(`${COLUMNS}/here`, column("here", "from", "a0"))
    rows.set(`${CARDS}/moved`, card("moved", "here", "a0"))
    // Out of storage order on purpose: position, not insertion, picks first.
    rows.set(`${COLUMNS}/second`, column("second", "to", "a1"))
    rows.set(`${COLUMNS}/gone`, column("gone", "to", "Zz", 5))
    rows.set(`${COLUMNS}/first`, column("first", "to", "a0"))
    rows.set(`${CARDS}/top`, card("top", "first", "a0"))

    const { moveCardToBoard } =
      await import("../src/api/operations/move-card-to-board")
    const copyId = await moveCardToBoard("moved", "to")

    expect(copyId).not.toBe("moved")
    const copy = stored(copyId)
    expect(copy.columnId).toBe("first")
    expect(copy.position < stored("top").position).toBe(true)
    expect(copy.title).toBe("moved")
    expect(copy.body).toBe("notes")
    expect(copy.attachments).toEqual([attachment])
    // The server numbers it for its new board.
    expect(copy.number).toBeNull()

    const original = stored("moved")
    expect(original.deletedAt).not.toBeNull()
    expect(original.columnId).toBe("here")
    // Or the server's purge of the tombstone would free the copy's files.
    expect(original.attachments).toEqual([])
    expect(liveIn("here")).toEqual([])

    // A move is not a deletion, so the trash must not list it.
    const { getTrash } = await import("../src/api/operations/get-trash")
    expect(await getTrash()).toEqual([])
  })

  it("refuses a board with no columns, leaving the card put", async () => {
    rows.set(`${COLUMNS}/here`, column("here", "from", "a0"))
    rows.set(`${CARDS}/moved`, card("moved", "here", "a0"))

    const { moveCardToBoard } =
      await import("../src/api/operations/move-card-to-board")
    await expect(moveCardToBoard("moved", "empty")).rejects.toThrow()
    expect(stored("moved").columnId).toBe("here")
    expect(stored("moved").deletedAt).toBeNull()
  })
})

describe("moveCardToColumn", () => {
  it("keeps the id within a board", async () => {
    rows.set(`${COLUMNS}/here`, column("here", "same", "a0"))
    rows.set(`${COLUMNS}/there`, column("there", "same", "a1"))
    rows.set(`${CARDS}/moved`, card("moved", "here", "a0"))

    const { moveCardToColumn } =
      await import("../src/api/operations/move-card-to-column")
    expect(await moveCardToColumn("moved", "there")).toBe("moved")
    expect(stored("moved").columnId).toBe("there")
    expect(stored("moved").deletedAt).toBeNull()
    expect([...rows.keys()].filter((k) => k.startsWith(CARDS))).toHaveLength(1)
  })
})
