import type { Dashboard } from "../../types"
import { db } from "../db/db"
import { getDashboards } from "./get-dashboards"

export type SidebarBoardNode = { type: "board"; dashboard: Dashboard }

export type SidebarFolderNode = {
  type: "folder"
  id: string
  title: string
  collapsed: boolean
  boards: Dashboard[]
}

export type SidebarNode = SidebarBoardNode | SidebarFolderNode

/**
 * The sidebar tree in display order
 */
export async function getSidebarTree(): Promise<SidebarNode[]> {
  const [dashboards, layout] = await Promise.all([
    getDashboards(),
    db.getSidebarLayout(),
  ])
  const byId = new Map(dashboards.map((d) => [d.id, d]))

  const nodes: SidebarNode[] = []
  for (const item of layout.items) {
    if (item.type === "board") {
      const dashboard = byId.get(item.id)
      if (dashboard) nodes.push({ type: "board", dashboard })
    } else {
      nodes.push({
        type: "folder",
        id: item.id,
        title: item.title,
        collapsed: item.collapsed,
        boards: item.boardIds.flatMap((id) => byId.get(id) ?? []),
      })
    }
  }

  const listed = new Set(
    layout.items.flatMap((item) =>
      item.type === "board" ? [item.id] : item.boardIds
    )
  )
  for (const dashboard of dashboards) {
    if (!listed.has(dashboard.id)) nodes.push({ type: "board", dashboard })
  }

  return nodes
}
