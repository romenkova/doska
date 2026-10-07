import { describe, expect, it } from "vitest"
import { describeEntry } from "../src/api/history/describe"
import type { HistoryEntry } from "../src/types"

const entry = (
  action: HistoryEntry["action"],
  data: HistoryEntry["data"] = {}
): HistoryEntry => ({
  id: "hist1",
  boardId: "board1",
  entityId: "card1",
  entityType: "card",
  userId: null,
  action,
  data,
  createdAt: 0,
  updatedAt: 0,
  deletedAt: null,
})

describe("describeEntry", () => {
  it("create", () => {
    expect(describeEntry(entry("create"))).toBe("created")
  })

  it("edit", () => {
    expect(describeEntry(entry("edit"))).toBe("edited")
  })

  it("rename", () => {
    expect(describeEntry(entry("rename", { from: "A", to: "B" }))).toBe(
      "renamed from A to B"
    )
  })

  it("move within a board", () => {
    expect(describeEntry(entry("move", { from: "Todo", to: "Done" }))).toBe(
      "moved from Todo to Done"
    )
  })

  it("move across boards", () => {
    const data = {
      from: "Todo",
      to: "Inbox",
      fromBoard: "Work",
      toBoard: "Home",
    }
    expect(describeEntry(entry("move", data))).toBe(
      "moved from Todo (Work) to Inbox (Home)"
    )
  })

  it("delete", () => {
    expect(describeEntry(entry("delete"))).toBe("deleted")
  })

  it("restore", () => {
    expect(describeEntry(entry("restore"))).toBe("restored")
  })
})
