import type { Change } from "@deck/contract"
import { keys } from "@/lib/data/keys"
import { queryClient } from "@/lib/query-client"
import { CARDS, COLUMNS } from "../constants"
import { idb } from "../db/idb"

/**
 * Applies pulled changes to IndexedDB under last-writer-wins, then invalidates
 * the queries whose data the writes touched so the open board re-renders.
 */
export async function applyRemote(boardId: string, changes: Change[]) {
  const touchedCards: string[] = []
  let touchedBoard = false
  let touchedDashboards = false

  for (const { store, record } of changes) {
    const existing = await idb.get<{ updatedAt: number }>(store, record.id)
    if (existing && existing.updatedAt >= record.updatedAt) continue
    await idb.set(store, record.id, record)

    if (store === CARDS) {
      touchedCards.push(record.id)
      touchedBoard = true
    } else if (store === COLUMNS) {
      touchedBoard = true
    } else {
      touchedDashboards = true
    }
  }

  if (touchedDashboards)
    queryClient.invalidateQueries({ queryKey: keys.dashboards })
  if (touchedBoard)
    queryClient.invalidateQueries({ queryKey: keys.board(boardId) })
  for (const id of touchedCards)
    queryClient.invalidateQueries({ queryKey: keys.card(id) })
}
