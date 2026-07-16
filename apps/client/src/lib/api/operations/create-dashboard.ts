import { generateKeyBetween } from "fractional-indexing"
import { derivePrefix } from "@doska/contract"
import { BOARD_COLUMNS } from "@/lib/seed"
import type { Dashboard } from "@/lib/types"
import { db } from "../db/db"
import { sync } from "../sync"

/** Creates a board with the default columns, appends it to the list, returns it. */
export async function createDashboard(name: string): Promise<Dashboard> {
  const id = `board-${crypto.randomUUID().slice(0, 8)}`
  const list = await db.getDashboards()
  const last = list.reduce<string | null>(
    (max, d) => (max === null || d.position > max ? d.position : max),
    null
  )
  const position = generateKeyBetween(last, null)
  const dashboard: Dashboard = {
    id,
    title: name,
    position,
    prefix: derivePrefix(
      name,
      list.map((d) => d.prefix)
    ),
    updatedAt: Date.now(),
    deletedAt: null,
  }
  await db.setDashboard(dashboard)
  sync.markDirty("dashboards", id)

  await Promise.all(
    BOARD_COLUMNS.map(async (template) => {
      const column = {
        ...template,
        id: `col-${crypto.randomUUID().slice(0, 8)}`,
        dashboardId: id,
        updatedAt: Date.now(),
        deletedAt: null,
      }
      await db.setColumn(column)
      sync.markDirty("columns", column.id)
    })
  )
  return dashboard
}
