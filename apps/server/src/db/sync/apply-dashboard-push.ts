import type { DashboardChange } from "@deck/contract"
import { eq } from "drizzle-orm"
import { db } from "../client"
import { counters, dashboards } from "../schema"

/** The `counters` row that orders dashboard-list changes account-wide. */
const DASHBOARDS_COUNTER = "dashboards"

/**
 * Applies a client's pushed dashboard-list changes under last-writer-wins,
 * bumping the account-level dashboards counter once per accepted write. Runs in
 * one transaction so the counter and the rows it stamps never drift apart.
 *
 * Mirrors {@link applyPush} but for the board-independent list channel: the
 * `seq` it stamps orders dashboards across every board, so any client can pull
 * the whole list past its cursor.
 */
export async function applyDashboardPush(
  changes: DashboardChange[]
): Promise<void> {
  if (changes.length === 0) return

  await db.transaction(async (tx) => {
    await tx
      .insert(counters)
      .values({ id: DASHBOARDS_COUNTER, value: 0 })
      .onConflictDoNothing()
    const [counter] = await tx
      .select({ value: counters.value })
      .from(counters)
      .where(eq(counters.id, DASHBOARDS_COUNTER))
      .limit(1)
    let seq = counter?.value ?? 0

    for (const { record } of changes) {
      const [current] = await tx
        .select({ updatedAt: dashboards.updatedAt })
        .from(dashboards)
        .where(eq(dashboards.id, record.id))
        .limit(1)
      if (current && current.updatedAt >= record.updatedAt) continue
      const row = {
        id: record.id,
        title: record.title,
        position: record.position,
        updatedAt: record.updatedAt,
        deletedAt: record.deletedAt,
        seq: seq + 1,
      }
      await tx
        .insert(dashboards)
        .values(row)
        .onConflictDoUpdate({ target: dashboards.id, set: row })
      seq += 1
    }

    await tx
      .update(counters)
      .set({ value: seq })
      .where(eq(counters.id, DASHBOARDS_COUNTER))
  })
}
