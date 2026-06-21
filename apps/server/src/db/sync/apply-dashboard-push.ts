import type { DashboardChange } from "@doska/contract"
import { applyChanges } from "./apply-changes"
import { dashboardsCounter } from "./counter"
import { dashboards } from "../schema"
import { upsertLWW } from "./core/upsert-lww"

/**
 * Applies a client's pushed dashboard-list changes under last-writer-wins,
 * bumping the account-level dashboards counter once per accepted write.
 *
 * Mirrors {@link applyPush} but for the board-independent list channel: the
 * `seq` it stamps orders dashboards across every board, so any client can pull
 * the whole list past its cursor.
 */
export function applyDashboardPush(changes: DashboardChange[]): Promise<void> {
  return applyChanges(dashboardsCounter(), changes, (tx, { record }, nextSeq) =>
    upsertLWW(tx, dashboards, dashboards.id, dashboards.updatedAt, {
      id: record.id,
      title: record.title,
      position: record.position,
      updatedAt: record.updatedAt,
      deletedAt: record.deletedAt,
      seq: nextSeq,
    })
  )
}
