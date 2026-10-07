import { beforeEach, describe, expect, it } from "vitest"
import { HISTORY } from "../src/api/constants"
import { getHistory } from "../src/api/history/get-history"
import type { HistoryEntry } from "../src/types"
import { installMemoryRuntime, rows } from "./memory-runtime"

const add = (
  id: string,
  entityId: string,
  createdAt: number,
  action: HistoryEntry["action"] = "edit",
  data: HistoryEntry["data"] = {}
) =>
  rows.set(`${HISTORY}/${id}`, {
    id,
    boardId: "board1",
    entityId,
    entityType: "card",
    userId: null,
    action,
    data,
    createdAt,
    updatedAt: createdAt,
    deletedAt: null,
  } satisfies HistoryEntry)

const ids = (entries: HistoryEntry[]) => entries.map((entry) => entry.id)

beforeEach(() => {
  installMemoryRuntime()
})

describe("getHistory", () => {
  it("follows cross-board moves back to the original card", async () => {
    add("a-create", "cardA", 1, "create")
    add("a-edit", "cardA", 2)
    add("b-move", "cardB", 3, "move", { fromCard: "cardA" })
    add("c-move", "cardC", 4, "move", { fromCard: "cardB" })
    add("c-edit", "cardC", 5)

    expect(ids(await getHistory("cardC"))).toEqual([
      "c-edit",
      "c-move",
      "b-move",
      "a-edit",
      "a-create",
    ])
  })

  it("stops when the linked card has no rows left", async () => {
    add("b-move", "cardB", 3, "move", { fromCard: "cardA" })

    expect(ids(await getHistory("cardB"))).toEqual(["b-move"])
  })
})
