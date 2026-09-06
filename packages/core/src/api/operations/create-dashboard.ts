import { generateKeyBetween } from "fractional-indexing"
import { BOARD_COLUMNS } from "../../seed"
import type { Dashboard } from "../../types"
import { db } from "../db/db"
import { newId } from "./new-id"
import { prependBoard } from "./sidebar-layout"
import { sync } from "../sync"
import { stamp } from "../sync/hlc"

/** Creates a board with the default columns at the top of the sidebar, returns it. */
export async function createDashboard(name: string): Promise<Dashboard> {
  const id = newId("board")
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
    sort: [],
    updatedAt: stamp(),
    deletedAt: null,
  }
  await db.setDashboard(dashboard)
  sync.markDirty("dashboards", id)
  await prependBoard(id)

  await Promise.all(
    BOARD_COLUMNS.map(async (template) => {
      const column = {
        ...template,
        id: newId("col"),
        dashboardId: id,
        updatedAt: stamp(),
        deletedAt: null,
      }
      await db.setColumn(column)
      sync.markDirty("columns", column.id)
    })
  )
  return dashboard
}
