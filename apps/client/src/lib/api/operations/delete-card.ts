import { db } from "../db/db"
import { markDirty } from "../sync/sync"

/** Tombstones a card. */
export async function deleteCard(_deckId: string, id: string): Promise<void> {
  const existing = await db.getCard(id)
  if (!existing) return
  await db.softDeleteCard(existing)
  markDirty("cards", id)
}
