import type { TreeFolder, TreeItem, TreeNode } from "../src"

export type Item = { title: string }
export type Folder = { title: string }
export type Node = TreeNode<Item, Folder>

export const item = (title: string): TreeItem<Item> => ({
  type: "item",
  id: crypto.randomUUID(),
  data: { title },
})

export const folder = (
  title: string,
  items: TreeItem<Item>[] = [],
  folders: TreeFolder<Item, Folder>[] = []
): TreeFolder<Item, Folder> => ({
  type: "folder",
  id: crypto.randomUUID(),
  data: { title },
  folders,
  items,
})

export const INITIAL: Node[] = [
  folder(
    "Work",
    [item("Roadmap"), item("Hiring")],
    [
      folder(
        "Clients",
        [item("Acme"), item("Globex")],
        [folder("Archive", [item("Initech")])]
      ),
    ]
  ),
  folder("Home", [item("Groceries"), item("Renovation")]),
  folder("Empty"),
  item("Inbox"),
  item("Reading list"),
]
