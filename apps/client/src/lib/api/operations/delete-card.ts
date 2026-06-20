import { db } from "../db"
import { markDirty } from "../sync"

/** Tombstones a card. */
export async function deleteCard(_deckId: string, id: string): Promise<void> {
  const existing = await db.getCard(id)
  if (!existing) return
  const now = Date.now()
  await db.setCard({ ...existing, deletedAt: now, updatedAt: now })
  markDirty("cards", id)
}
