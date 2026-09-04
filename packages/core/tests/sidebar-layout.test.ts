import { describe, expect, it } from "vitest"
import type { Dashboard, SidebarItem } from "../src/types"
import { buildTree, treeItems } from "../src/api/operations/get-sidebar-tree"
import { moveItem, placeBoards } from "../src/api/operations/sidebar-layout"

const board = (id: string): SidebarItem => ({ type: "board", id })
const folder = (id: string, boardIds: string[]): SidebarItem => ({
  type: "folder",
  id,
  title: id,
  collapsed: false,
  boardIds,
})
const ids = (items: SidebarItem[]) =>
  items.map((item) =>
    item.type === "board" ? item.id : `${item.id}[${item.boardIds.join(",")}]`
  )

describe("moveItem", () => {
  const items = [board("a"), folder("f", ["b"]), board("c")]

  it("reorders at the root", () => {
    expect(ids(moveItem(items, "a", { kind: "root", index: 2 }))).toEqual([
      "f[b]",
      "c",
      "a",
    ])
  })

  it("moves a board into a folder and back out", () => {
    const into = moveItem(items, "c", {
      kind: "folder",
      folderId: "f",
      index: 0,
    })
    expect(ids(into)).toEqual(["a", "f[c,b]"])
    expect(ids(moveItem(into, "b", { kind: "root", index: 0 }))).toEqual([
      "b",
      "a",
      "f[c]",
    ])
  })

  it("moves a folder as a block and never into another folder", () => {
    const two = [folder("f", ["a"]), folder("g", ["b"]), board("c")]
    expect(
      moveItem(two, "f", { kind: "folder", folderId: "g", index: 0 })
    ).toBe(two)
    expect(ids(moveItem(two, "f", { kind: "root", index: 2 }))).toEqual([
      "g[b]",
      "c",
      "f[a]",
    ])
  })
})

describe("placeBoards and buildTree", () => {
  const dashboards = ["a", "b", "c"].map((id) => ({ id }) as Dashboard)
  const items = [board("a"), folder("f", ["gone", "b"])]

  it("drops dead ids and appends unlisted boards at the root", () => {
    expect(ids(placeBoards(items, dashboards))).toEqual(["a", "f[b]", "c"])
  })

  it("round-trips through the tree", () => {
    const tree = buildTree(items, dashboards)
    expect(tree[1]).toMatchObject({ type: "folder", boards: [{ id: "b" }] })
    expect(ids(treeItems(tree))).toEqual(["a", "f[b]", "c"])
  })
})
