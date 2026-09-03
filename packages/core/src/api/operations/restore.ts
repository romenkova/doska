import type { Card, Column, Dashboard } from "../../types"
import { CARDS, COLUMNS, DASHBOARDS } from "../constants"
import { db } from "../db/db"
import { sync } from "../sync"
import { live } from "./live"

/** Which store a trashed thing lives in: the tombstoned ones, not the layout. */
export type TrashKind = typeof CARDS | typeof COLUMNS | typeof DASHBOARDS

/**
 * Deleting cascades downwards, so restoring has to cascade both ways.
 *
 * Down: a delete tombstones the record first and its descendants after, so
 * every descendant swept up in it carries a `deletedAt` at or past the
 * parent's. Anything deleted on its own beforehand has a strictly smaller
 * stamp and stays in the trash, which is what you'd want — it was a separate
 * deletion.
 *
 * Up: a card whose column or board is still tombstoned would come back
 * invisible, so its ancestors come back with it.
 */
const cascadedFrom = <T extends { deletedAt: number | null }>(
  records: T[],
  deletedAt: number
) => records.filter((r) => r.deletedAt !== null && r.deletedAt >= deletedAt)

/** Restores `id` plus everything the same deletion took with it. Restoring an
 * already-live record is a no-op, so undo and the trash can race harmlessly. */
export async function restore(kind: TrashKind, id: string): Promise<void> {
  const [dashboards, columns] = await Promise.all([
    db.getDashboards(),
    db.getColumns(),
  ])

  const cards: Card[] = []
  const revivedColumns: Column[] = []
  let revivedDashboard: Dashboard | undefined

  if (kind === DASHBOARDS) {
    const dashboard = dashboards.find((d) => d.id === id)
    if (!dashboard?.deletedAt) return
    revivedDashboard = dashboard
    revivedColumns.push(
      ...cascadedFrom(
        columns.filter((c) => c.dashboardId === id),
        dashboard.deletedAt
      )
    )
    for (const column of revivedColumns) {
      cards.push(
        ...cascadedFrom(await db.getCards(column.id), dashboard.deletedAt)
      )
    }
  } else if (kind === COLUMNS) {
    const column = columns.find((c) => c.id === id)
    if (!column?.deletedAt) return
    revivedColumns.push(column)
    cards.push(...cascadedFrom(await db.getCards(id), column.deletedAt))
    revivedDashboard = dashboards.find(
      (d) => d.id === column.dashboardId && !live(d)
    )
  } else {
    const card = await db.getCard(id)
    if (!card?.deletedAt) return
    cards.push(card)
    const column = columns.find((c) => c.id === card.columnId)
    if (column && !live(column)) revivedColumns.push(column)
    const dashboard = dashboards.find((d) => d.id === column?.dashboardId)
    if (dashboard && !live(dashboard)) revivedDashboard = dashboard
  }

  // Top down: the server cascades a board's tombstone onto anything pushed for
  // it, so the board has to be live again before its contents land.
  if (revivedDashboard) {
    await db.restoreDashboard(revivedDashboard)
    sync.markDirty(DASHBOARDS, revivedDashboard.id)
  }
  for (const column of revivedColumns) {
    await db.restoreColumn(column)
    sync.markDirty(COLUMNS, column.id)
  }
  for (const card of cards) {
    await db.restoreCard(card)
    sync.markDirty(CARDS, card.id)
  }
}
