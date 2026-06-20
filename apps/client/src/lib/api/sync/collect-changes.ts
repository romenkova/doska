import type { Change } from "@deck/contract"
import type { Card, Column, Dashboard } from "@/lib/types"
import { CARDS, COLUMNS, DASHBOARDS } from "../constants"
import { idb } from "../db/idb"
import type { DirtyStore } from "./dirty"

/**
 * Resolves the dirty refs that belong to `boardId` into a `Change[]` to push,
 * alongside the refs consumed (so they can be restored if the push fails).
 * Refs for other boards stay dirty and push when their board is active.
 */
export async function collectChanges(
  boardId: string,
  dirty: DirtyStore
): Promise<{
  changes: Change[]
  refs: string[]
}> {
  const changes: Change[] = []
  const refs: string[] = []

  for (const ref of dirty.all()) {
    const [store, id] = ref.split("/")

    switch (store) {
      case DASHBOARDS: {
        const record = await idb.get<Dashboard>(DASHBOARDS, id)
        // The dashboard *is* the board, so its id is the boardId.
        if (record && record.id === boardId) {
          changes.push({ store, record })
          refs.push(ref)
        }
        break
      }
      case COLUMNS: {
        const record = await idb.get<Column>(COLUMNS, id)
        if (record && record.dashboardId === boardId) {
          changes.push({ store, record })
          refs.push(ref)
        }
        break
      }
      case CARDS: {
        const record = await idb.get<Card>(CARDS, id)
        if (!record) continue
        const column = await idb.get<Column>(COLUMNS, record.columnId)
        if (column && column.dashboardId === boardId) {
          changes.push({ store, record })
          refs.push(ref)
        }
        break
      }
    }
  }

  return { changes, refs }
}
