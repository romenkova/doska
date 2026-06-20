import { db } from "../db"
import { markDirty } from "../sync"

/** Renames a board. */
export async function renameDashboard(id: string, name: string): Promise<void> {
  const list = await db.getDashboards()
  const dashboard = list.find((d) => d.id === id)
  if (!dashboard) return
  await db.setDashboard({ ...dashboard, title: name, updatedAt: Date.now() })
  markDirty("dashboards", id)
}
