import { describe, expect, it, vi } from "vitest"
import type { Dashboard, SidebarItem } from "../src/types"
import { buildTree, treeItems } from "../src/api/operations/get-sidebar-tree"
import { placeBoards } from "../src/api/operations/sidebar-layout"

// The module marks the layout dirty on write; the pure helpers under test never do.
vi.mock("../src/api/sync", () => ({ sync: { markDirty: () => {} } }))

const board = (id: string): SidebarItem => ({ type: "board", id })
const folder = (id: string, boardIds: string[]): SidebarItem => ({
  type: "folder",
  id,
  title: id,
  boardIds,
})
const ids = (items: SidebarItem[]) =>
  items.map((item) =>
    item.type === "board" ? item.id : `${item.id}[${item.boardIds.join(",")}]`
  )

describe("placeBoards and buildTree", () => {
  const dashboards = ["a", "b", "c"].map((id) => ({ id }) as Dashboard)
  const items = [board("a"), folder("f", ["gone", "b"])]

  it("drops dead ids and appends unlisted boards at the root", () => {
    expect(ids(placeBoards(items, dashboards))).toEqual(["a", "f[b]", "c"])
  })

  it("round-trips through the tree", () => {
    const tree = buildTree(items, dashboards)
    expect(tree[1]).toMatchObject({ type: "folder", items: [{ id: "b" }] })
    expect(ids(treeItems(tree))).toEqual(["a", "f[b]", "c"])
  })
})

describe("subfolders", () => {
  const sub = (id: string, parentId: string, boardIds: string[]) => ({
    type: "folder" as const,
    id,
    title: id,
    parentId,
    boardIds,
  })
  const nested = (items: SidebarItem[]) =>
    items.map((item) =>
      item.type === "board"
        ? item.id
        : `${item.parentId ? `${item.parentId}/` : ""}${item.id}[${item.boardIds.join(",")}]`
    )
  const items = [
    folder("f", ["b"]),
    sub("s", "f", ["c"]),
    folder("g", []),
    board("a"),
  ]

  it("builds subfolders under their root folder", () => {
    const dashboards = ["a", "b", "c"].map((id) => ({ id }) as Dashboard)
    const tree = buildTree(items, dashboards)
    expect(tree[0]).toMatchObject({
      type: "folder",
      items: [{ id: "b" }],
      folders: [{ id: "s", items: [{ id: "c" }] }],
    })
    expect(nested(treeItems(tree))).toEqual(nested(items))
  })

  it("nests folders at any depth", () => {
    const deep = [folder("f", []), sub("s", "f", []), sub("t", "s", [])]
    const tree = buildTree(deep, [])
    expect(tree).toMatchObject([
      { id: "f", folders: [{ id: "s", folders: [{ id: "t", folders: [] }] }] },
    ])
    expect(nested(treeItems(tree))).toEqual(nested(deep))
  })

  it("puts a folder whose parent is gone, or in a parent cycle, at the root", () => {
    const orphans = [
      sub("s", "missing", []),
      sub("t", "s", []),
      sub("x", "y", []),
      sub("y", "x", []),
    ]
    expect(nested(treeItems(buildTree(orphans, [])))).toEqual([
      "s[]",
      "s/t[]",
      "x[]",
      "x/y[]",
    ])
  })
})
