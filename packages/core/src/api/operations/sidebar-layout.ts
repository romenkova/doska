import type { Dashboard, SidebarItem } from "../../types"
import { SIDEBAR, SIDEBAR_LAYOUT_ID } from "../constants"
import { db } from "../db/db"
import { stamp } from "../sync/hlc"
import { sync } from "../sync"
import { getDashboards } from "./get-dashboards"
import { newId } from "./new-id"

export type SidebarTarget =
  | { kind: "root"; index: number }
  | { kind: "folder"; folderId: string; index: number }

// Dead ids dropped, unlisted boards appended at the root: the rendered order.
export function placeBoards(
  items: SidebarItem[],
  dashboards: Dashboard[]
): SidebarItem[] {
  const live = new Set(dashboards.map((d) => d.id))
  const placed = new Set<string>()
  const result: SidebarItem[] = []
  for (const item of items) {
    if (item.type === "board") {
      if (!live.has(item.id)) continue
      placed.add(item.id)
      result.push(item)
      continue
    }
    const boardIds = item.boardIds.filter((id) => live.has(id))
    for (const id of boardIds) placed.add(id)
    result.push({ ...item, boardIds })
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

export async function createFolder(title: string): Promise<string> {
  const id = newId("folder")
  await updateSidebarLayout((items) => [
    { type: "folder", id, title, collapsed: false, boardIds: [] },
    ...items,
  ])
  return id
}

export function prependBoard(id: string): Promise<void> {
  return updateSidebarLayout((items) => [{ type: "board", id }, ...items])
}

export function setFolderCollapsed(
  id: string,
  collapsed: boolean
): Promise<void> {
  return updateSidebarLayout((items) =>
    items.map((item) =>
      item.type === "folder" && item.id === id ? { ...item, collapsed } : item
    )
  )
}

export function renameFolder(id: string, title: string): Promise<void> {
  return updateSidebarLayout((items) =>
    items.map((item) =>
      item.type === "folder" && item.id === id ? { ...item, title } : item
    )
  )
}

/** The folder's boards take its place at the root, so nothing moves on screen. */
export function deleteFolder(id: string): Promise<void> {
  return updateSidebarLayout((items) =>
    items.flatMap((item) =>
      item.type === "folder" && item.id === id
        ? item.boardIds.map((boardId) => ({
            type: "board" as const,
            id: boardId,
          }))
        : [item]
    )
  )
}

// `index` counts with the moved item already taken out. Folders stay at root.
export function moveItem(
  items: SidebarItem[],
  id: string,
  target: SidebarTarget
): SidebarItem[] {
  const folder = items.find((item) => item.type === "folder" && item.id === id)
  if (folder && target.kind === "folder") return items
  const moved: SidebarItem = folder ?? { type: "board", id }

  const rest: SidebarItem[] = []
  for (const item of items) {
    if (item.id === id) continue
    if (item.type === "folder") {
      rest.push({
        ...item,
        boardIds: item.boardIds.filter((boardId) => boardId !== id),
      })
    } else {
      rest.push(item)
    }
  }

  if (target.kind === "root") {
    rest.splice(target.index, 0, moved)
    return rest
  }
  return rest.map((item) => {
    if (item.type !== "folder" || item.id !== target.folderId) return item
    const boardIds = [...item.boardIds]
    boardIds.splice(target.index, 0, id)
    return { ...item, boardIds }
  })
}

export async function moveSidebarItem(
  id: string,
  target: SidebarTarget
): Promise<void> {
  const dashboards = await getDashboards()
  await updateSidebarLayout((items) =>
    moveItem(placeBoards(items, dashboards), id, target)
  )
}
