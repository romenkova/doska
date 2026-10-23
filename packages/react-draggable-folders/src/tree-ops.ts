import type { TreeFolder, TreeItem, TreeMove, TreeNode } from "./types"

/** Applies a move from `onMove`. A move that names no folder, or puts a folder inside itself, changes nothing. */
export function moveNode<I, F>(
  nodes: TreeNode<I, F>[],
  move: TreeMove
): TreeNode<I, F>[] {
  const moved = findNode(nodes, move.id)
  if (!moved) return nodes
  const { target } = move
  if (target.kind === "folder") {
    const parent = findNode(nodes, target.folderId)
    if (parent?.type !== "folder") return nodes
    if (moved.type === "folder" && findNode([moved], parent.id)) return nodes
  }

  const rest = without(nodes, move.id)
  if (target.kind === "root") {
    const next = [...rest]
    next.splice(target.index, 0, moved)
    return next
  }
  return mapFolders(rest, (folder) => {
    if (folder.id !== target.folderId) return folder
    if (moved.type === "folder") {
      const folders = [...folder.folders]
      folders.splice(target.index, 0, moved)
      return { ...folder, folders }
    }
    const items = [...folder.items]
    items.splice(target.index, 0, moved)
    return { ...folder, items }
  })
}

/** Deletes a folder; what it held moves up one level into its place. */
export function removeFolder<I, F>(
  nodes: TreeNode<I, F>[],
  id: string
): TreeNode<I, F>[] {
  const root = nodes.flatMap((node): TreeNode<I, F>[] =>
    node.type === "folder" && node.id === id
      ? [...node.folders, ...node.items]
      : [node]
  )
  return mapFolders(root, (folder) => {
    const index = folder.folders.findIndex((sub) => sub.id === id)
    if (index < 0) return folder
    const removed = folder.folders[index]!
    const folders = [...folder.folders]
    folders.splice(index, 1, ...removed.folders)
    return { ...folder, folders, items: [...removed.items, ...folder.items] }
  })
}

/** Puts a new folder first: at the root, or among `parentId`'s subfolders. */
export function addFolder<I, F>(
  nodes: TreeNode<I, F>[],
  folder: TreeFolder<I, F>,
  parentId?: string
): TreeNode<I, F>[] {
  if (!parentId) return [folder, ...nodes]
  return mapFolders(nodes, (parent) =>
    parent.id === parentId
      ? { ...parent, folders: [folder, ...parent.folders] }
      : parent
  )
}

export function updateItem<I, F>(
  nodes: TreeNode<I, F>[],
  id: string,
  data: I
): TreeNode<I, F>[] {
  const edit = (item: TreeItem<I>) =>
    item.id === id ? { ...item, data } : item
  const root = nodes.map((node) => (node.type === "item" ? edit(node) : node))
  return mapFolders(root, (folder) => ({
    ...folder,
    items: folder.items.map(edit),
  }))
}

export function updateFolder<I, F>(
  nodes: TreeNode<I, F>[],
  id: string,
  data: F
): TreeNode<I, F>[] {
  return mapFolders(nodes, (folder) =>
    folder.id === id ? { ...folder, data } : folder
  )
}

function findNode<I, F>(
  nodes: TreeNode<I, F>[],
  id: string
): TreeNode<I, F> | undefined {
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.type !== "folder") continue
    const found = findNode<I, F>([...node.folders, ...node.items], id)
    if (found) return found
  }
  return undefined
}

function without<I, F>(nodes: TreeNode<I, F>[], id: string): TreeNode<I, F>[] {
  return mapFolders(
    nodes.filter((node) => node.id !== id),
    (folder) => ({
      ...folder,
      folders: folder.folders.filter((sub) => sub.id !== id),
      items: folder.items.filter((item) => item.id !== id),
    })
  )
}

/** Rebuilds every folder, deepest first, through `edit`. */
function mapFolders<I, F>(
  nodes: TreeNode<I, F>[],
  edit: (folder: TreeFolder<I, F>) => TreeFolder<I, F>
): TreeNode<I, F>[] {
  const walk = (folder: TreeFolder<I, F>): TreeFolder<I, F> =>
    edit({ ...folder, folders: folder.folders.map(walk) })
  return nodes.map((node) => (node.type === "folder" ? walk(node) : node))
}
