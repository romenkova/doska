import type { TreeFolder, TreeItem, TreeNode } from "../../../src"

export type Item = { title: string }
export type Folder = { title: string }
export type Entry = TreeNode<Item, Folder>

export const item = (title: string): TreeItem<Item> => ({
  type: "item",
  id: crypto.randomUUID(),
  data: { title },
})

export const folder = (
  title: string,
  children: Entry[] = []
): TreeFolder<Item, Folder> => ({
  type: "folder",
  id: crypto.randomUUID(),
  data: { title },
  folders: children.filter((child) => child.type === "folder"),
  items: children.filter((child) => child.type === "item"),
})

export const INITIAL: Entry[] = [
  folder("Work", [
    folder("Clients", [
      folder("Archive", [item("Initech")]),
      item("Acme"),
      item("Globex"),
    ]),
    item("Roadmap"),
    item("Hiring"),
  ]),
  folder("Home", [item("Groceries"), item("Renovation")]),
  folder("Empty"),
  item("Inbox"),
  item("Reading list"),
]
