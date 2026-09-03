import type { SidebarItem } from "../../types"
import { db } from "../db/db"
import { stamp } from "../sync/hlc"
import { newId } from "./new-id"

async function updateSidebarLayout(
  edit: (items: SidebarItem[]) => SidebarItem[]
): Promise<void> {
  const layout = await db.getSidebarLayout()
  await db.setSidebarLayout({
    ...layout,
    items: edit(layout.items),
    updatedAt: stamp(),
  })
}

export async function createFolder(title: string): Promise<string> {
  const id = newId("folder")
  await updateSidebarLayout((items) => [
    ...items,
    { type: "folder", id, title, collapsed: false, boardIds: [] },
  ])
  return id
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
