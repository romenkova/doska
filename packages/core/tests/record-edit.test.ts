import { beforeEach, describe, expect, it } from "vitest"
import { COLUMNS, HISTORY } from "../src/api/constants"
import { recordEdit } from "../src/api/history/record-edit"
import type { Card, HistoryEntry } from "../src/types"
import { installMemoryRuntime, rows } from "./memory-runtime"

const before = {
  id: "card1",
  columnId: "col1",
  title: "Title",
  body: "one",
} as Card

const historyRows = () =>
  [...rows.entries()]
    .filter(([key]) => key.startsWith(`${HISTORY}/`))
    .map(([, row]) => row as HistoryEntry)

const pastEdit = (overrides: Partial<HistoryEntry>): HistoryEntry => ({
  id: "hist-old",
  boardId: "board1",
  entityId: "card1",
  entityType: "card",
  userId: null,
  action: "edit",
  data: { field: "body" },
  createdAt: Date.now(),
  updatedAt: Date.now(),
  deletedAt: null,
  ...overrides,
})

const editBody = (from: Card, body: string) =>
  recordEdit({ ...from, body }, { body }, from)

beforeEach(() => {
  installMemoryRuntime()
  rows.set(`${COLUMNS}/col1`, { id: "col1", dashboardId: "board1" })
})

describe("recordEdit", () => {
  it("keeps two saves within 5 minutes as one row", async () => {
    await editBody(before, "one\ntwo")
    await editBody({ ...before, body: "one\ntwo" }, "one\ntwo\nthree")

    const [entry, ...rest] = historyRows()
    expect(rest).toEqual([])
    expect(entry.boardId).toBe("board1")
    expect(entry.action).toBe("edit")
  })

  it("records an empty card as created when it gets its first content", async () => {
    const empty = { ...before, title: "", body: "" }
    await editBody(empty, "one")

    const entries = historyRows()
    expect(entries.map((entry) => entry.action)).toEqual(["create"])
  })

  it("names a new card's untitled rows once it gets a title", async () => {
    const untitled = { ...before, title: "" }
    await editBody(untitled, "one\ntwo")
    await recordEdit(
      { ...untitled, title: "Title" },
      { title: "Title" },
      untitled
    )

    const entries = historyRows()
    expect(entries.map((entry) => entry.data)).toEqual([
      { field: "body", title: "Title" },
    ])
  })

  it("records each changed field on its own row", async () => {
    const after = { ...before, priority: "high", deadline: "2026-10-09" }
    await recordEdit(
      after,
      { priority: "high", deadline: "2026-10-09" },
      before
    )

    const fields = historyRows().map((entry) => entry.data.field)
    expect(fields).toEqual(["priority", "deadline"])
  })

  it("keeps the first value when the same field changes again", async () => {
    const withPriority = (priority: string) => ({ ...before, priority })
    await recordEdit(
      withPriority("high"),
      { priority: "high" },
      withPriority("")
    )
    await recordEdit(
      withPriority("low"),
      { priority: "low" },
      withPriority("high")
    )

    const [entry, ...rest] = historyRows()
    expect(rest).toEqual([])
    expect(entry.data).toMatchObject({ field: "priority", from: "", to: "low" })
  })

  it("cancels a tag added and removed again", async () => {
    const withTags = (tags: string[]) => ({ ...before, tags })
    await recordEdit(
      withTags(["a", "b"]),
      { tags: ["a", "b"] },
      withTags(["a"])
    )
    await recordEdit(withTags(["a"]), { tags: ["a"] }, withTags(["a", "b"]))

    const [entry] = historyRows()
    expect(entry.data).toMatchObject({ field: "tags", from: ["a"], to: ["a"] })
  })

  it("starts a new row after 5 minutes", async () => {
    rows.set(
      `${HISTORY}/hist-old`,
      pastEdit({ createdAt: Date.now() - 6 * 60 * 1000 })
    )
    await editBody(before, "one\ntwo")
    expect(historyRows()).toHaveLength(2)
  })

  it("starts a new row when the last one is someone else's", async () => {
    rows.set(`${HISTORY}/hist-old`, pastEdit({ userId: "someone-else" }))
    await editBody(before, "one\ntwo")
    expect(historyRows()).toHaveLength(2)
  })

  it("records nothing when the patch changes nothing", async () => {
    await recordEdit(before, { title: "Title" }, before)
    await recordEdit(before, { bodyConflict: null }, before)
    expect(historyRows()).toEqual([])
  })
})
