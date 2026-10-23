import type { Dashboard, SidebarItem } from "../../types"
import { SIDEBAR, SIDEBAR_LAYOUT_ID } from "../constants"
import { db } from "../db/db"
import { stamp } from "../sync/hlc"
import { sync } from "../sync"

// Dead ids dropped, unlisted boards appended at the root: the rendered order.
export function placeBoards(
  items: SidebarItem[],
  dashboards: Dashboard[]
): SidebarItem[] {
  const live = new Set(dashboards.map((d) => d.id))
  const placed = new Set<string>()
  const keep = (id: string) => {
    if (live.has(id)) placed.add(id)
    return live.has(id)
  }

  const result: SidebarItem[] = []
  for (const item of items) {
    if (item.type === "board") {
      if (keep(item.id)) result.push(item)
      continue
    }
    result.push({ ...item, boardIds: item.boardIds.filter(keep) })
  }
  for (const dashboard of dashboards) {
    if (placed.has(dashboard.id)) continue
    result.push({ type: "board", id: dashboard.id })
  }
  return result
}

async function updateSidebarLayout(
  edit: (items: SidebarItem[]) => SidebarItem[]
): Promise<void> {
  const layout = await db.getSidebarLayout()
  await db.setSidebarLayout({
    ...layout,
    items: edit(layout.items),
    updatedAt: stamp(),
  })
  sync.markDirty(SIDEBAR, SIDEBAR_LAYOUT_ID)
}

/** Stores a layout the client already rearranged. */
export function saveSidebarItems(items: SidebarItem[]): Promise<void> {
  return updateSidebarLayout(() => items)
}

export function prependBoard(id: string): Promise<void> {
  return updateSidebarLayout((items) => [{ type: "board", id }, ...items])
}
