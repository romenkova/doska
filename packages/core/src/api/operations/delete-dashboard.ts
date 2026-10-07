import { db } from "../db/db"
import { recordHistory } from "../history/record-history"
import { sync } from "../sync"

/** Tombstones a board, its columns, and all of their cards. */
export async function deleteDashboard(id: string): Promise<void> {
  const dashboard = await db.getDashboard(id)
  const columns = (await db.getColumns()).filter((c) => c.dashboardId === id)
  const cards = (
    await Promise.all(columns.map((c) => db.getCards(c.id)))
  ).flat()

  await Promise.all([
    ...(dashboard ? [db.softDeleteDashboard(dashboard)] : []),
    ...columns.map((c) => db.softDeleteColumn(c)),
    ...cards.map((c) => db.softDeleteCard(c)),
  ])

  sync.markDirty("dashboards", id)
  for (const c of columns) sync.markDirty("columns", c.id)
  for (const c of cards) sync.markDirty("cards", c.id)
  if (dashboard) await recordHistory.board(id, "delete")
}
