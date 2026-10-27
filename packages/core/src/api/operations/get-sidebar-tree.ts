import type { Dashboard, SidebarItem } from "../../types"
import { db } from "../db/db"
import { getDashboards } from "./get-dashboards"
import { placeBoards } from "./sidebar-layout"

// The shape react-draggable-folders takes, so the tree goes to it as is.
export type SidebarBoardNode = { type: "item"; id: string; data: Dashboard }

export type SidebarFolderNode = {
  type: "folder"
  id: string
  data: { title: string }
  folders: SidebarFolderNode[]
  items: SidebarBoardNode[]
}

export type SidebarNode = SidebarBoardNode | SidebarFolderNode

type Folder = Extract<SidebarItem, { type: "folder" }>

// A folder whose parent is gone sits at the root, and so does one caught in a parent cycle.
export function buildTree(
  items: SidebarItem[],
  dashboards: Dashboard[]
): SidebarNode[] {
  const placed = placeBoards(items, dashboards)
  const byId = new Map(dashboards.map((d) => [d.id, d]))
  const board = (id: string): SidebarBoardNode => ({
    type: "item",
    id,
    data: byId.get(id)!,
  })
  const folders = placed.filter(
    (item): item is Folder => item.type === "folder"
  )
  const folderIds = new Set(folders.map((folder) => folder.id))
  const isRoot = (folder: Folder) =>
    !folder.parentId || !folderIds.has(folder.parentId)

  const built = new Set<string>()
  const build = (folder: Folder): SidebarFolderNode => {
    built.add(folder.id)
    const subfolders = folders.filter(
      (sub) => sub.parentId === folder.id && !built.has(sub.id)
    )
    return {
      type: "folder",
      id: folder.id,
      data: { title: folder.title },
      folders: subfolders.map(build),
      items: folder.boardIds.map(board),
    }
  }

  const roots = new Map(
    folders.filter(isRoot).map((folder) => [folder.id, build(folder)])
  )
  return placed.flatMap((item): SidebarNode[] => {
    if (item.type === "board") return [board(item.id)]
    const root = roots.get(item.id)
    if (root) return [root]
    if (!built.has(item.id)) return [build(item)]
    return []
  })
}

export function treeItems(nodes: SidebarNode[]): SidebarItem[] {
  const folderItems = (
    folder: SidebarFolderNode,
    parentId: string | null
  ): SidebarItem[] => {
    const item: Folder = {
      type: "folder",
      id: folder.id,
      title: folder.data.title,
      boardIds: folder.items.map((one) => one.id),
    }
    if (parentId) item.parentId = parentId
    return [
      item,
      ...folder.folders.flatMap((sub) => folderItems(sub, folder.id)),
    ]
  }
  return nodes.flatMap((node): SidebarItem[] =>
    node.type === "item"
      ? [{ type: "board", id: node.id }]
      : folderItems(node, null)
  )
}

export async function getSidebarTree(): Promise<SidebarNode[]> {
  const [dashboards, layout] = await Promise.all([
    getDashboards(),
    db.getSidebarLayout(),
  ])
  return buildTree(layout.items, dashboards)
}
