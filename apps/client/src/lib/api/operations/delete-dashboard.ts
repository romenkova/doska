import { db } from "../db"
import { markDirty } from "../sync"

/** Tombstones a board, its columns, and all of their cards. */
export async function deleteDashboard(id: string): Promise<void> {
  const now = Date.now()
  const dashboard = (await db.getDashboards()).find((d) => d.id === id)
  const columns = (await db.getColumns()).filter((c) => c.dashboardId === id)
  const columnIds = new Set(columns.map((c) => c.id))
  const cards = (await db.getCards()).filter((c) => columnIds.has(c.columnId))

  await Promise.all([
    ...(dashboard
      ? [db.setDashboard({ ...dashboard, deletedAt: now, updatedAt: now })]
      : []),
    ...columns.map((c) =>
      db.setColumn({ ...c, deletedAt: now, updatedAt: now })
    ),
    ...cards.map((c) => db.setCard({ ...c, deletedAt: now, updatedAt: now })),
  ])

  markDirty("dashboards", id)
  for (const c of columns) markDirty("columns", c.id)
  for (const c of cards) markDirty("cards", c.id)
}
