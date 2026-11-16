import { beforeEach, describe, expect, it } from "vitest"
import { CARDS, COLUMNS, DASHBOARDS } from "../src/api/constants"
import type { Card, Dashboard } from "../src/types"
import { installMemoryRuntime, rows } from "./memory-runtime"

const board = (id: string, tagColors: Record<string, string> = {}) => ({
  id,
  title: id,
  position: "a0",
  sort: [],
  tagColors,
  template: false,
  updatedAt: 1,
  deletedAt: null,
})
const column = (id: string, dashboardId: string) => ({
  id,
  title: id,
  dashboardId,
  position: "a0",
  collapsed: false,
  done: false,
  color: "",
  stamps: { title: 1 },
  updatedAt: 1,
  deletedAt: null,
})
const card = (id: string, columnId: string, tags: string[]) => ({
  id,
  columnId,
  position: "a0",
  title: id,
  body: "#bug in the body",
  number: 1,
  deadline: null,
  priority: null,
  tags,
  users: [],
  attachments: [],
  template: false,
  stamps: { title: 1 },
  bodyConflict: null,
  updatedAt: 1,
  deletedAt: null,
})

const tagsOf = (id: string) => (rows.get(`${CARDS}/${id}`) as Card).tags
const colorsOf = (id: string) =>
  (rows.get(`${DASHBOARDS}/${id}`) as Dashboard).tagColors

beforeEach(() => {
  installMemoryRuntime()
  rows.set(`${DASHBOARDS}/b1`, board("b1", { bug: "rose", ops: "blue" }))
  rows.set(`${DASHBOARDS}/b2`, board("b2"))
  rows.set(`${COLUMNS}/c1`, column("c1", "b1"))
  rows.set(`${COLUMNS}/c2`, column("c2", "b2"))
  rows.set(`${CARDS}/one`, card("one", "c1", ["Bug", "ui"]))
  rows.set(`${CARDS}/two`, card("two", "c1", ["ui", "defect"]))
  rows.set(`${CARDS}/other`, card("other", "c2", ["bug"]))
})

describe("renameTag", () => {
  it("renames in place on this board only, leaving bodies alone", async () => {
    const { renameTag } = await import("../src/api/operations/rename-tag")
    await renameTag("b1", "bug", "defect")

    expect(tagsOf("one")).toEqual(["defect", "ui"])
    expect(tagsOf("other")).toEqual(["bug"])
    expect((rows.get(`${CARDS}/one`) as Card).body).toBe("#bug in the body")
  })

  it("merges into a tag the card already has", async () => {
    const { renameTag } = await import("../src/api/operations/rename-tag")
    await renameTag("b1", "ui", "defect")

    expect(tagsOf("two")).toEqual(["defect"])
    expect(tagsOf("one")).toEqual(["Bug", "defect"])
  })
})

describe("deleteTag", () => {
  it("removes the tag from this board's cards only", async () => {
    const { deleteTag } = await import("../src/api/operations/rename-tag")
    await deleteTag("b1", "BUG")

    expect(tagsOf("one")).toEqual(["ui"])
    expect(tagsOf("other")).toEqual(["bug"])
  })
})

describe("tag colors", () => {
  it("sets and clears by lowercased name", async () => {
    const { setTagColor } = await import("../src/api/operations/set-tag-color")
    await setTagColor("b1", "UI", "green")
    await setTagColor("b1", "bug", "")

    expect(colorsOf("b1")).toEqual({ ops: "blue", ui: "green" })
  })

  it("moves with a rename, and the target keeps its color on a merge", async () => {
    const { moveTagColor } = await import("../src/api/operations/set-tag-color")
    await moveTagColor("b1", "bug", "defect")
    expect(colorsOf("b1")).toEqual({ defect: "rose", ops: "blue" })

    await moveTagColor("b1", "defect", "ops")
    expect(colorsOf("b1")).toEqual({ ops: "blue" })
  })

  it("handles boards stored before tag colors existed", async () => {
    const legacy: Partial<Dashboard> = board("old")
    delete legacy.tagColors
    rows.set(`${DASHBOARDS}/old`, legacy)
    const { setTagColor } = await import("../src/api/operations/set-tag-color")
    await setTagColor("old", "bug", "rose")

    expect(colorsOf("old")).toEqual({ bug: "rose" })
  })
})
