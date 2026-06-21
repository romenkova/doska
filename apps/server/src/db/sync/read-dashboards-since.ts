import type { DashboardChange } from "@deck/contract"
import { eq, gt } from "drizzle-orm"
import { db } from "../client"
import { counters, dashboards } from "../schema"

/** The `counters` row that orders dashboard-list changes account-wide. */
const DASHBOARDS_COUNTER = "dashboards"

/**
 * Returns every dashboard changed past `since`, plus the dashboards counter's
 * high-water mark to hand back as the next cursor. Board-independent: a client
 * gets every board's metadata regardless of which one it has open.
 */
export async function readDashboardsSince(since: number): Promise<{
  cursor: number
  changes: DashboardChange[]
}> {
  const [counter] = await db
    .select({ value: counters.value })
    .from(counters)
    .where(eq(counters.id, DASHBOARDS_COUNTER))
    .limit(1)
  const cursor = counter?.value ?? 0

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
        updatedAt: r.updatedAt,
        deletedAt: r.deletedAt,
      },
    })
  }

  return { cursor, changes }
}
