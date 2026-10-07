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
  data: { fields: ["body"], added: 1, removed: 0 },
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
  it("merges two body saves within 5 minutes into one row", async () => {
    await editBody(before, "one\ntwo")
    await editBody({ ...before, body: "one\ntwo" }, "one\ntwo\nthree")

    const [entry, ...rest] = historyRows()
    expect(rest).toEqual([])
    expect(entry.boardId).toBe("board1")
    expect(entry.data).toEqual({ fields: ["body"], added: 2, removed: 0 })
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
