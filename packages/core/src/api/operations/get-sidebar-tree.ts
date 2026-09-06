import type { Dashboard, SidebarItem } from "../../types"
import { db } from "../db/db"
import { getDashboards } from "./get-dashboards"
import { placeBoards } from "./sidebar-layout"

export type SidebarBoardNode = { type: "board"; dashboard: Dashboard }

export type SidebarFolderNode = {
  type: "folder"
  id: string
  title: string
  collapsed: boolean
  boards: Dashboard[]
}

export type SidebarNode = SidebarBoardNode | SidebarFolderNode

export function buildTree(
  items: SidebarItem[],
  dashboards: Dashboard[]
): SidebarNode[] {
  const byId = new Map(dashboards.map((d) => [d.id, d]))
  return placeBoards(items, dashboards).map((item) =>
    item.type === "board"
      ? { type: "board", dashboard: byId.get(item.id)! }
      : {
          type: "folder",
          id: item.id,
          title: item.title,
          collapsed: item.collapsed,
          boards: item.boardIds.map((id) => byId.get(id)!),
        }
  )
}

export function treeItems(nodes: SidebarNode[]): SidebarItem[] {
  return nodes.map((node) =>
    node.type === "board"
      ? { type: "board", id: node.dashboard.id }
      : {
          type: "folder",
          id: node.id,
          title: node.title,
          collapsed: node.collapsed,
          boardIds: node.boards.map((d) => d.id),
        }
  )
}

export function treeDashboards(nodes: SidebarNode[]): Dashboard[] {
  return nodes.flatMap((node) =>
    node.type === "board" ? [node.dashboard] : node.boards
  )
}

export async function getSidebarTree(): Promise<SidebarNode[]> {
  const [dashboards, layout] = await Promise.all([
    getDashboards(),
    db.getSidebarLayout(),
  ])
  return buildTree(layout.items, dashboards)
}
