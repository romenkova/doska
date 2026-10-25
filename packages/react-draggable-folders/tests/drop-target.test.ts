import { describe, expect, it } from "vitest"
import type { DropResult } from "@hello-pangea/dnd"
import { dropTarget } from "../src/tree/drop-target"
import { flattenTree } from "../src/tree/flatten-tree"
import type { TreeFolder, TreeNode, TreeRow } from "../src/types"

type Folder = TreeFolder<null, null>

const board = (id: string): TreeNode<null, null> => ({
  type: "item",
  id,
  data: null,
})
const folder = (
  id: string,
  boards: string[],
  folders: Folder[] = []
): Folder => ({
  type: "folder",
  id,
  data: null,
  folders,
  items: boards.map((one) => ({ type: "item", id: one, data: null })),
})

// Rows: a, F, b, c, F:empty (hidden), G (collapsed, holds g1), d.
const rows = flattenTree(
  [board("a"), folder("F", ["b", "c"]), folder("G", ["g1"]), board("d")],
  ["G"]
)

// `destination` is the index in the list with the dragged row taken out.
const dropIn =
  (rows: TreeRow<null, null>[]) =>
  (id: string, destination: number, depth = 0) =>
    dropTarget(
      rows,
      {
        draggableId: id,
        source: { droppableId: "s", index: rows.findIndex((r) => r.id === id) },
        destination: { droppableId: "s", index: destination },
      } as DropResult,
      depth,
      { item: 2, folder: 1 }
    )
const drop = dropIn(rows)
const root = (id: string, index: number) => ({
  id,
  target: { kind: "root", index },
})
const inFolder = (id: string, folderId: string, index: number) => ({
  id,
  target: { kind: "folder", folderId, index },
})

it("flattens expanded folders, each with an empty row after its boards", () => {
  expect(rows.map((r) => r.id)).toEqual([
    "a",
    "F",
    "b",
    "c",
    "F:empty",
    "G",
    "d",
  ])
  expect(rows[4]).toMatchObject({ type: "empty", hidden: true })
  const empty = flattenTree([folder("E", [])], [])
  expect(empty[1]).toMatchObject({ type: "empty", hidden: false })
})

describe("dropTarget", () => {
  it("is null in place or outside the list", () => {
    expect(drop("a", 0)).toBeNull()
    expect(drop("c", 3, 1)).toBeNull()
    expect(
      dropTarget(rows, { draggableId: "a" } as DropResult, 0, {
        item: 2,
        folder: 1,
      })
    ).toBeNull()
  })

  it("never drops a folder between a folder's boards", () => {
    expect(drop("G", 3)).toBeNull()
  })

  it("reorders at the root", () => {
    expect(drop("a", 6)).toEqual(root("a", 3))
    expect(drop("F", 5)).toEqual(root("F", 2))
  })

  it("puts a board under an expanded header or mid-folder into that folder", () => {
    expect(drop("a", 1)).toEqual(inFolder("a", "F", 0))
    expect(drop("a", 2)).toEqual(inFolder("a", "F", 1))
    expect(drop("b", 1)).toEqual(root("b", 1))
  })

  it("at the end of a block, or under a collapsed header, nesting decides", () => {
    expect(drop("a", 4, 1)).toEqual(inFolder("a", "F", 2))
    expect(drop("a", 4)).toEqual(root("a", 1))
    expect(drop("c", 3)).toEqual(root("c", 2))
    expect(drop("a", 5, 1)).toEqual(inFolder("a", "G", 1))
    expect(drop("a", 5)).toEqual(root("a", 2))
  })
})

describe("subfolders", () => {
  // Rows: F, S, s1, S:empty (hidden), f1, F:empty (hidden), G, G:empty, d.
  const tree = flattenTree(
    [folder("F", ["f1"], [folder("S", ["s1"])]), folder("G", []), board("d")],
    []
  )
  const drop = dropIn(tree)

  it("flattens a subfolder above its parent's boards", () => {
    expect(tree.map((r) => `${r.id}@${r.path.length}`)).toEqual([
      "F@0",
      "S@1",
      "s1@2",
      "S:empty@2",
      "f1@1",
      "F:empty@1",
      "G@0",
      "G:empty@1",
      "d@0",
    ])
  })

  it("puts a board in a subfolder only as deep as the pointer asks", () => {
    // d right under s1: the row below is f1, at depth 1.
    expect(drop("d", 4, 2)).toEqual(inFolder("d", "S", 1))
    expect(drop("d", 4, 1)).toEqual(inFolder("d", "F", 0))
  })

  it("never nests a folder two deep or a folder that has subfolders", () => {
    expect(drop("G", 3, 2)).toEqual(inFolder("G", "F", 1))
    expect(drop("F", 8, 1)).toEqual(root("F", 2))
    // Between s1 and f1 a folder can be at most one deep, never under S.
    expect(drop("G", 3, 0)).toEqual(inFolder("G", "F", 1))
  })

  it("keeps subfolders above boards", () => {
    // d between F's header and S goes in after S.
    expect(drop("d", 1, 1)).toEqual(inFolder("d", "F", 0))
    // G right under f1.
    expect(drop("G", 5, 1)).toBeNull()
  })

  it("is null where nothing fits", () => {
    // F right under G's header would have to go inside G.
    expect(drop("F", 6)).toBeNull()
    expect(drop("F", 7)).toEqual(root("F", 1))
  })
})
