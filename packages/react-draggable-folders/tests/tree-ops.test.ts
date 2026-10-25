import { describe, expect, it } from "vitest"
import { moveNode, removeFolder } from "../src/tree/tree-ops"
import type { TreeFolder, TreeNode } from "../src/types"

type Node = TreeNode<null, null>
type Folder = TreeFolder<null, null>

const item = (id: string): Node => ({ type: "item", id, data: null })
const folder = (
  id: string,
  items: string[],
  folders: Folder[] = []
): Folder => ({
  type: "folder",
  id,
  data: null,
  folders,
  items: items.map((one) => ({ type: "item", id: one, data: null })),
})

// "F[S[s1],f1]" style: a folder's subfolders, then its items.
const show = (nodes: Node[]): string[] =>
  nodes.map((node) =>
    node.type === "item"
      ? node.id
      : `${node.id}[${[...show(node.folders), ...show(node.items)].join(",")}]`
  )

const tree: Node[] = [
  folder("F", ["f1"], [folder("S", ["s1"])]),
  folder("G", []),
  item("a"),
]

describe("moveNode", () => {
  it("reorders at the root, a folder with what it holds", () => {
    const next = moveNode(tree, { id: "F", target: { kind: "root", index: 2 } })
    expect(show(next)).toEqual(["G[]", "a", "F[S[s1],f1]"])
  })

  it("moves an item into a subfolder and a folder into a folder", () => {
    const into = moveNode(tree, {
      id: "a",
      target: { kind: "folder", folderId: "S", index: 0 },
    })
    expect(show(into)).toEqual(["F[S[a,s1],f1]", "G[]"])
    const nested = moveNode(tree, {
      id: "G",
      target: { kind: "folder", folderId: "F", index: 1 },
    })
    expect(show(nested)).toEqual(["F[S[s1],G[],f1]", "a"])
  })

  it("takes a subfolder back out to the root", () => {
    const next = moveNode(tree, { id: "S", target: { kind: "root", index: 0 } })
    expect(show(next)).toEqual(["S[s1]", "F[f1]", "G[]", "a"])
  })

  it("changes nothing for a missing folder or a folder into itself", () => {
    const missing = { kind: "folder", folderId: "nope", index: 0 } as const
    expect(moveNode(tree, { id: "a", target: missing })).toBe(tree)
    const self = { kind: "folder", folderId: "S", index: 0 } as const
    expect(moveNode(tree, { id: "F", target: self })).toBe(tree)
  })
})

describe("removeFolder", () => {
  it("lifts a root folder's subfolders, then its items, into its place", () => {
    expect(show(removeFolder(tree, "F"))).toEqual(["S[s1]", "f1", "G[]", "a"])
  })

  it("puts a subfolder's items first in its parent", () => {
    expect(show(removeFolder(tree, "S"))).toEqual(["F[s1,f1]", "G[]", "a"])
  })
})
