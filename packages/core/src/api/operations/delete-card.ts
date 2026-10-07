import { db } from "../db/db"
import { recordHistory } from "../history/record-history"
import { sync } from "../sync"

/** Tombstones a card. */
export async function deleteCard(_deckId: string, id: string): Promise<void> {
  const existing = await db.getCard(id)
  if (!existing) return
  await db.softDeleteCard(existing)
  sync.markDirty("cards", id)

  const column = await db.getColumn(existing.columnId)
  if (!column) return
  await recordHistory.card(column.dashboardId, id, "delete")
}
