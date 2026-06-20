import { db } from "../db/db"
import { sync } from "../sync"

/** Tombstones a card. */
export async function deleteCard(_deckId: string, id: string): Promise<void> {
  const existing = await db.getCard(id)
  if (!existing) return
  await db.softDeleteCard(existing)
  sync.markDirty("cards", id)
}
