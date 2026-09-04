import type { DashboardChange } from "@doska/contract"
import type { DirtyStore } from "@doska/sync"
import type { Card, Column, Dashboard, SidebarLayout } from "../../../types"
import { keys } from "../../../data/keys"
import { queryClient } from "../../../query-client"
import { runtime } from "../../../runtime"
import {
  CARDS,
  CARDS_BY_COLUMN,
  COLUMNS,
  DASHBOARDS,
  SIDEBAR,
} from "../../constants"
import { clock, persistClock } from "../hlc"

/** Account-level dashboard-list steps, shared server ⇄ filesystem. */

export async function collectDashboardChanges(
  dirty: DirtyStore
): Promise<{ changes: DashboardChange[]; refs: string[] }> {
  const changes: DashboardChange[] = []
  const refs: string[] = []
  const dead: string[] = []

  for (const ref of dirty.all()) {
    const [store, id] = ref.split("/")
    let change: DashboardChange | undefined
    switch (store) {
      case DASHBOARDS: {
        const record = await runtime().db.get<Dashboard>(DASHBOARDS, id)
        if (record) change = { store: DASHBOARDS, record }
        break
      }
      case SIDEBAR: {
        const record = await runtime().db.get<SidebarLayout>(SIDEBAR, id)
        if (record) change = { store: SIDEBAR, record }
        break
      }
      default:
        continue
    }

    if (!change) {
      dead.push(ref)
      continue
    }
    changes.push(change)
    refs.push(ref)
  }

  if (dead.length) dirty.drop(dead)

  return { changes, refs }
}

/** Hard-deletes a board's columns and cards, tombstoned or not. */
export async function purgeBoard(boardId: string): Promise<void> {
  const columns = await runtime().db.getAll<Column>(COLUMNS)
  for (const column of columns) {
    if (column.dashboardId !== boardId) continue
    const cards = await runtime().db.getAll<Card>(CARDS, {
      index: CARDS_BY_COLUMN,
      range: { lower: column.id, upper: column.id },
    })
    for (const card of cards) await runtime().db.delete(CARDS, card.id)
    await runtime().db.delete(COLUMNS, column.id)
  }
  queryClient.invalidateQueries({ queryKey: keys.board(boardId) })
}

/** LWW-upserts pulled changes; purges a board on tombstone. */
export async function applyDashboardRemote(
  changes: DashboardChange[]
): Promise<void> {
  let touched = false

  for (const { store, record } of changes) {
    clock.receive(record.updatedAt)
    const existing = await runtime().db.get<{ updatedAt: number }>(
      store,
      record.id
    )
    if (existing && existing.updatedAt >= record.updatedAt) continue
    await runtime().db.set(store, record.id, record)
    touched = true
    if (store === DASHBOARDS && record.deletedAt != null)
      await purgeBoard(record.id)
  }
  void persistClock()

  if (touched) {
    queryClient.invalidateQueries({ queryKey: keys.dashboards })
    // Digest rows carry their board's title, and a tombstoned board drops out.
    queryClient.invalidateQueries({ queryKey: keys.digest })
  }
}
