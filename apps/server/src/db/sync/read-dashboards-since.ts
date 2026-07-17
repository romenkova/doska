import type { BoardSort, DashboardChange } from "@doska/contract"
import { gt } from "drizzle-orm"
import { db } from "../client"
import { dashboardsCounter } from "./counter"
import { dashboards } from "../schema"

/**
 * Returns every dashboard changed past `since`, plus the dashboards counter's
 * high-water mark to hand back as the next cursor. Board-independent: a client
 * gets every board's metadata regardless of which one it has open.
 */
export async function readDashboardsSince(since: number): Promise<{
  cursor: number
  changes: DashboardChange[]
}> {
  const cursor = await dashboardsCounter().read(db)

  const changes: DashboardChange[] = []
  for (const r of await db
    .select()
    .from(dashboards)
    .where(gt(dashboards.seq, since))) {
    changes.push({
      store: "dashboards",
      record: {
        id: r.id,
        title: r.title,
        position: r.position,
        prefix: r.prefix,
        sort: r.sort as BoardSort,
        updatedAt: r.updatedAt,
        deletedAt: r.deletedAt,
      },
    })
  }

  return { cursor, changes }
}
