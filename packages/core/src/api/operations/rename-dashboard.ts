import { db } from "../db/db"
import { recordHistory } from "../history/record-history"
import { sync } from "../sync"
import { stamp } from "../sync/hlc"

/** Renames a board. */
export async function renameDashboard(id: string, name: string): Promise<void> {
  const dashboard = await db.getDashboard(id)
  if (!dashboard) return
  await db.setDashboard({ ...dashboard, title: name, updatedAt: stamp() })
  sync.markDirty("dashboards", id)
  if (dashboard.title === name) return
  await recordHistory.board(id, "rename", { from: dashboard.title, to: name })
}
