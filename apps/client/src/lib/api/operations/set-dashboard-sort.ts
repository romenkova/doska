import type { BoardSort } from "@doska/contract"
import { db } from "../db/db"
import { sync } from "../sync"
import { stamp } from "../sync/hlc"

/** Sets a board's card-ordering mode (manual position vs. by deadline). */
export async function setDashboardSort(
  id: string,
  sort: BoardSort
): Promise<void> {
  const dashboard = (await db.getDashboards()).find((d) => d.id === id)
  if (!dashboard || dashboard.sort === sort) return
  await db.setDashboard({ ...dashboard, sort, updatedAt: stamp() })
  sync.markDirty("dashboards", id)
}
