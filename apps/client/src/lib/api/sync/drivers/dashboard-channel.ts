import type { DashboardChange } from "@doska/contract"
import type { DirtyStore } from "@doska/sync"
import type { Card, Column, Dashboard } from "@/lib/types"
import { keys } from "@/lib/data/keys"
import { queryClient } from "@/lib/query-client"
import { CARDS, COLUMNS, DASHBOARDS } from "../../constants"
import { CARDS_BY_COLUMN, idb } from "../../db/idb"

/** Account-level dashboard-list steps, shared server ⇄ filesystem. */

export async function collectDashboardChanges(
  dirty: DirtyStore
): Promise<{ changes: DashboardChange[]; refs: string[] }> {
  const changes: DashboardChange[] = []
  const refs: string[] = []
  const dead: string[] = []

  for (const ref of dirty.all()) {
    const [store, id] = ref.split("/")
    if (store !== DASHBOARDS) continue

    const record = await idb.get<Dashboard>(DASHBOARDS, id)
    if (!record) {
      dead.push(ref)
      continue
    }
    changes.push({ store: DASHBOARDS, record })
    refs.push(ref)
  }

  if (dead.length) dirty.clear(dead)

  return { changes, refs }
}

/** Hard-deletes a tombstoned board's columns and cards. */
async function purgeBoard(boardId: string): Promise<void> {
  const columns = await idb.getAll<Column>(COLUMNS)
  for (const column of columns) {
    if (column.dashboardId !== boardId) continue
    const cards = await idb.getAll<Card>(CARDS, {
      index: CARDS_BY_COLUMN,
      range: IDBKeyRange.only(column.id),
    })
    for (const card of cards) await idb.delete(CARDS, card.id)
    await idb.delete(COLUMNS, column.id)
  }
  queryClient.invalidateQueries({ queryKey: keys.board(boardId) })
}

/** LWW-upserts pulled changes; purges a board on tombstone. */
export async function applyDashboardRemote(
  changes: DashboardChange[]
): Promise<void> {
  let touched = false

  for (const { record } of changes) {
    const existing = await idb.get<{ updatedAt: number }>(DASHBOARDS, record.id)
    if (existing && existing.updatedAt >= record.updatedAt) continue
    await idb.set(DASHBOARDS, record.id, record)
    touched = true
    if (record.deletedAt != null) await purgeBoard(record.id)
  }

  if (touched) queryClient.invalidateQueries({ queryKey: keys.dashboards })
}
