import { useState } from "react"
import {
  addFolder,
  moveNode,
  removeFolder,
  updateFolder,
  updateItem,
} from "./tree-ops"
import type { TreeFolder, TreeMove, TreeNode } from "./types"

export interface FolderTreeOptions<I, F> {
  /** New nodes (a sync, a refetch) replace any edits made since. Keep the array stable between renders. */
  nodes: TreeNode<I, F>[]
  /** Read once, on mount. */
  collapsedIds?: string[]
  /** Called after every edit, to persist it. */
  onChange?: (nodes: TreeNode<I, F>[]) => void
  onCollapsedChange?: (id: string, collapsed: boolean) => void
}

export interface FolderTree<I, F> {
  nodes: TreeNode<I, F>[]
  collapsedIds: string[]
  move: (move: TreeMove) => void
  addFolder: (folder: TreeFolder<I, F>, parentId?: string) => void
  removeFolder: (id: string) => void
  updateItem: (id: string, data: I) => void
  updateFolder: (id: string, data: F) => void
  setCollapsed: (id: string, collapsed: boolean) => void
  toggle: (id: string) => void
}

export function useFolderTree<I, F>({
  nodes: source,
  collapsedIds: initialCollapsed = [],
  onChange,
  onCollapsedChange,
}: FolderTreeOptions<I, F>): FolderTree<I, F> {
  const [edited, setEdited] = useState<{
    source: TreeNode<I, F>[]
    nodes: TreeNode<I, F>[]
  } | null>(null)
  const [collapsedIds, setCollapsedIds] = useState(initialCollapsed)
  const nodes = edited?.source === source ? edited.nodes : source

  const commit = (next: TreeNode<I, F>[]) => {
    if (next === nodes) return
    setEdited({ source, nodes: next })
    onChange?.(next)
  }

  const setCollapsed = (id: string, collapsed: boolean) => {
    if (collapsedIds.includes(id) === collapsed) return
    setCollapsedIds(
      collapsed
        ? [...collapsedIds, id]
        : collapsedIds.filter((one) => one !== id)
    )
    onCollapsedChange?.(id, collapsed)
  }

  return {
    nodes,
    collapsedIds,
    move: (move) => commit(moveNode(nodes, move)),
    addFolder: (folder, parentId) => {
      commit(addFolder(nodes, folder, parentId))
      if (parentId) setCollapsed(parentId, false)
    },
    removeFolder: (id) => commit(removeFolder(nodes, id)),
    updateItem: (id, data) => commit(updateItem(nodes, id, data)),
    updateFolder: (id, data) => commit(updateFolder(nodes, id, data)),
    setCollapsed,
    toggle: (id) => setCollapsed(id, !collapsedIds.includes(id)),
  }
}
