import { generateKeyBetween } from "fractional-indexing"
import type { Dashboard } from "../../types"
import { db } from "../db/db"
import { recordHistory } from "../history/record-history"
import { newId } from "./new-id"
import { prependBoard } from "./sidebar-layout"
import { sync } from "../sync"
import { stamp } from "../sync/hlc"

/**
 * Creates a board with no columns at the top of the sidebar, or of
 * `folderId`, returns it. {@link fillBoard} gives it columns.
 */
export async function createDashboard(
  name: string,
  folderId?: string
): Promise<Dashboard> {
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
    template: false,
    updatedAt: stamp(),
    deletedAt: null,
  }
  await db.setDashboard(dashboard)
  sync.markDirty("dashboards", id)
  await prependBoard(id, folderId)
  await recordHistory.board(id, name, "create")
  return dashboard
}
