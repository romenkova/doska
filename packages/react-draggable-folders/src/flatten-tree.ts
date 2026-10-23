import type { TreeFolder, TreeNode, TreeRow } from "./types"

export function flattenTree<I, F>(
  nodes: TreeNode<I, F>[],
  collapsedIds: string[]
): TreeRow<I, F>[] {
  const rows: TreeRow<I, F>[] = []
  const addFolder = (folder: TreeFolder<I, F>, path: string[]) => {
    const collapsed = collapsedIds.includes(folder.id)
    rows.push({ type: "folder", id: folder.id, folder, collapsed, path })
    if (collapsed) return
    const inside = [...path, folder.id]
    for (const sub of folder.folders) addFolder(sub, inside)
    for (const item of folder.items) {
      rows.push({ type: "item", id: item.id, item, path: inside })
    }
    rows.push({
      type: "empty",
      id: `${folder.id}:empty`,
      folder,
      path: inside,
      hidden: folder.items.length + folder.folders.length > 0,
    })
  }
  for (const node of nodes) {
    if (node.type === "folder") {
      addFolder(node, [])
      continue
    }
    rows.push({ type: "item", id: node.id, item: node, path: [] })
  }
  return rows
}
