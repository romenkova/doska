import { beforeEach, describe, expect, it } from "vitest"
import { CARDS, COLUMNS } from "../src/api/constants"
import { installMemoryRuntime, rows } from "./memory-runtime"

const column = (
  id: string,
  dashboardId: string,
  position: string,
  deletedAt: number | null = null
) => ({ id, dashboardId, position, updatedAt: 1, deletedAt })
const card = (id: string, columnId: string, position: string) => ({
  id,
  columnId,
  position,
  updatedAt: 1,
  deletedAt: null,
})

const stored = (id: string) =>
  rows.get(`${CARDS}/${id}`) as { columnId: string; position: string }

beforeEach(installMemoryRuntime)

describe("moveCardToBoard", () => {
  it("lands the card on top of the target board's first live column", async () => {
    rows.set(`${COLUMNS}/here`, column("here", "from", "a0"))
    rows.set(`${CARDS}/moved`, card("moved", "here", "a0"))
    // Out of storage order on purpose: position, not insertion, picks first.
    rows.set(`${COLUMNS}/second`, column("second", "to", "a1"))
    rows.set(`${COLUMNS}/gone`, column("gone", "to", "Zz", 5))
    rows.set(`${COLUMNS}/first`, column("first", "to", "a0"))
    rows.set(`${CARDS}/top`, card("top", "first", "a0"))

    const { moveCardToBoard } =
      await import("../src/api/operations/move-card-to-board")
    await moveCardToBoard("moved", "to")

    expect(stored("moved").columnId).toBe("first")
    expect(stored("moved").position < stored("top").position).toBe(true)
  })

  it("refuses a board with no columns, leaving the card put", async () => {
    rows.set(`${COLUMNS}/here`, column("here", "from", "a0"))
    rows.set(`${CARDS}/moved`, card("moved", "here", "a0"))

    const { moveCardToBoard } =
      await import("../src/api/operations/move-card-to-board")
    await expect(moveCardToBoard("moved", "empty")).rejects.toThrow()
    expect(stored("moved").columnId).toBe("here")
  })
})
