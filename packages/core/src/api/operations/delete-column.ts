import { db } from "../db/db"
import { recordHistory } from "../history/record-history"
import { sync } from "../sync"

/** Tombstones a column and all of its cards. */
export async function deleteColumn(_deckId: string, id: string): Promise<void> {
  const column = await db.getColumn(id)
  if (!column) return
  const cards = await db.getCards(id)

  await Promise.all([
    db.softDeleteColumn(column),
    ...cards.map((c) => db.softDeleteCard(c)),
  ])

  sync.markDirty("columns", id)
  for (const c of cards) sync.markDirty("cards", c.id)
  await recordHistory.column(column.dashboardId, id, column.title, "delete")
}
