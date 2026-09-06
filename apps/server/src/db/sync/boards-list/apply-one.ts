import type { DashboardChange } from "@doska/contract"
import { eq } from "drizzle-orm"
import { type Tx } from "../core/counter"
import { dashboards, sidebarLayouts } from "../../schema"
import { upsertLWW } from "../core/upsert-lww"

/**
 * Upserts one dashboard-list change under last-writer-wins, stamping `nextSeq`
 * and, for a board this user is creating, `ownerId`. The board-list counterpart
 * to {@link applyOneBoard}.
 */
export async function applyOne(
  tx: Tx,
  change: DashboardChange,
  nextSeq: number,
  userId: string
): Promise<boolean> {
  if (change.store === "sidebar") {
    return upsertLWW(
      tx,
      sidebarLayouts,
      sidebarLayouts.userId,
      sidebarLayouts.updatedAt,
      {
        userId,
        items: change.record.items,
        updatedAt: change.record.updatedAt,
        seq: nextSeq,
      }
    )
  }

  const { record } = change
  const [existing] = await tx
    .select({ ownerId: dashboards.ownerId })
    .from(dashboards)
    .where(eq(dashboards.id, record.id))

  if (existing && existing.ownerId !== null && existing.ownerId !== userId) {
    console.warn(
      `boards-list: dropped push for dashboard ${record.id}, owned by another account`
    )
    return false
  }

  return upsertLWW(
    tx,
    dashboards,
    dashboards.id,
    dashboards.updatedAt,
    {
      id: record.id,
      title: record.title,
      position: record.position,
      sort: record.sort,
      ownerId: userId,
      updatedAt: record.updatedAt,
      deletedAt: record.deletedAt,
      seq: nextSeq,
    },
    // Ownership is decided by whoever inserted the row
    ["ownerId"]
  )
}
