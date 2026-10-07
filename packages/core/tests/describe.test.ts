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
  data: { title: "Fix login", ...data },
  createdAt: 0,
  updatedAt: 0,
  deletedAt: null,
})

const title = { kind: "title", text: "Fix login", cardId: "card1" }
const text = (text: string) => ({ kind: "text", text })
const chip = (text: string, board?: string) => ({ kind: "chip", text, board })
const arrow = { kind: "arrow" }

describe("describeEntry", () => {
  it.each([
    ["create", "created card"],
    ["delete", "deleted card"],
    ["restore", "restored card"],
  ] as const)("%s", (action, verb) => {
    expect(describeEntry(entry(action))).toEqual([text(verb), title])
  })

  it("body edit", () => {
    expect(describeEntry(entry("edit", { field: "body" }))).toEqual([
      text("edited card"),
      title,
    ])
  })

  it("rename", () => {
    const data = { title: "B", field: "title", from: "A", to: "B" }
    expect(describeEntry(entry("rename", data))).toEqual([
      text("renamed card"),
      chip("A"),
      arrow,
      chip("B"),
    ])
  })

  it("move across boards", () => {
    const data = {
      from: "Todo",
      to: "Inbox",
      fromBoard: "Work",
      toBoard: "Home",
    }
    expect(describeEntry(entry("move", data))).toEqual([
      text("moved card"),
      title,
      chip("Todo", "Work"),
      arrow,
      chip("Inbox", "Home"),
    ])
  })

  it("priority", () => {
    const data = { field: "priority", from: "", to: "high" }
    expect(describeEntry(entry("edit", data))).toEqual([
      text("set priority of"),
      title,
      text("to"),
      chip("High"),
    ])
  })

  it("cleared deadline", () => {
    const data = { field: "deadline", from: "2026-10-09", to: "" }
    expect(describeEntry(entry("edit", data))).toEqual([
      text("cleared deadline of"),
      title,
    ])
  })

  it("tags added and removed", () => {
    const data = { field: "tags", from: ["later"], to: ["urgent"] }
    expect(describeEntry(entry("edit", data))).toEqual([
      text("added"),
      chip("#urgent"),
      text("to"),
      title,
      text("and removed"),
      chip("#later"),
    ])
  })

  it("assignees", () => {
    const data = { field: "users", from: [], to: ["user1"] }
    expect(describeEntry(entry("edit", data))).toEqual([
      text("assigned"),
      { kind: "user", userId: "user1" },
      text("to"),
      title,
    ])
  })

  it("a list change that cancelled out reads as a plain edit", () => {
    const data = { field: "tags", from: ["a"], to: ["a"] }
    expect(describeEntry(entry("edit", data))).toEqual([
      text("edited card"),
      title,
    ])
  })

  it("leaves out a missing title", () => {
    expect(describeEntry(entry("create", { title: "" }))).toEqual([
      text("created card"),
    ])
  })
})
