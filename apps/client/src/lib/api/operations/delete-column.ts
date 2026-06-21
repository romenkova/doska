import { db } from "../db/db"
import { sync } from "../sync"

/** Tombstones a column and all of its cards. */
export async function deleteColumn(
  _deckId: string,
  id: string
): Promise<void> {
  const column = (await db.getColumns()).find((c) => c.id === id)
  if (!column) return
  const cards = await db.getCards(id)

  await Promise.all([
    db.softDeleteColumn(column),
    ...cards.map((c) => db.softDeleteCard(c)),
  ])

  sync.markDirty("columns", id)
  for (const c of cards) sync.markDirty("cards", c.id)
}
