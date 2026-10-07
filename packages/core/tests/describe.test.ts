import { describe, expect, it } from "vitest"
import { describeEntry } from "../src/api/history/describe"
import type { HistoryEntry } from "../src/types"

const entry = (
  action: HistoryEntry["action"],
  data: HistoryEntry["data"] = { title: "Fix login" }
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
    expect(describeEntry(entry("create"))).toBe("created card Fix login")
  })

  it("edit", () => {
    expect(describeEntry(entry("edit"))).toBe("edited card Fix login")
  })

  it("rename", () => {
    const column = {
      ...entry("rename", { title: "B", from: "A", to: "B" }),
      entityType: "column" as const,
    }
    expect(describeEntry(column)).toBe("renamed column from A to B")
  })

  it("move within a board", () => {
    const data = { title: "Fix login", from: "Todo", to: "Done" }
    expect(describeEntry(entry("move", data))).toBe(
      "moved card Fix login from Todo to Done"
    )
  })

  it("move across boards", () => {
    const data = {
      title: "Fix login",
      from: "Todo",
      to: "Inbox",
      fromBoard: "Work",
      toBoard: "Home",
    }
    expect(describeEntry(entry("move", data))).toBe(
      "moved card Fix login from Todo (Work) to Inbox (Home)"
    )
  })

  it("delete", () => {
    expect(describeEntry(entry("delete"))).toBe("deleted card Fix login")
  })

  it("restore", () => {
    expect(describeEntry(entry("restore"))).toBe("restored card Fix login")
  })

  it("leaves out a missing title", () => {
    expect(describeEntry(entry("create", {}))).toBe("created card")
  })
})
