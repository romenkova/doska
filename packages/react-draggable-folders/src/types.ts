export type TreeItem<I> = { type: "item"; id: string; data: I }

/** Inside a folder, its subfolders always come before its items. */
export type TreeFolder<I, F> = {
  type: "folder"
  id: string
  data: F
  folders: TreeFolder<I, F>[]
  items: TreeItem<I>[]
}

export type TreeNode<I, F> = TreeItem<I> | TreeFolder<I, F>

/** `index` counts the folder's subfolders when a folder moves, its items when an item does. */
export type DropTarget =
  | { kind: "root"; index: number }
  | { kind: "folder"; folderId: string; index: number }

export interface TreeMove {
  id: string
  target: DropTarget
}

export interface DepthLimits {
  /** How deep an item can sit: 1 is inside a root folder. */
  item: number
  /** How deep a folder can sit: 0 keeps every folder at the root. */
  folder: number
}

// `path` holds the folders a row sits in, outermost first, so its length is
// the row's depth. A folder header is not in its own path.
export type TreeRow<I, F> = { id: string; path: string[] } & (
  | { type: "folder"; folder: TreeFolder<I, F>; collapsed: boolean }
  | { type: "item"; item: TreeItem<I> }
  // Every expanded folder has one, hidden once it holds anything.
  | { type: "empty"; folder: TreeFolder<I, F>; hidden: boolean }
)
