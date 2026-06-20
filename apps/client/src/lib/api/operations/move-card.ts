import type { Card } from "@/lib/types"
import { db } from "../db/db"
import { sync } from "../sync"

/**
 * Persists cards whose column/position changed during a drag. Only the move is
 * applied: title/body are read back from the stored record so a concurrent edit
 * isn't clobbered by a stale copy from the board cache (the drag handler reads
 * cards from `keys.board`, which a rename doesn't invalidate).
 */
export async function moveCard(
  _deckId: string,
  changed: Card[]
): Promise<void> {
  const now = Date.now()
  await Promise.all(
    changed.map(async (card) => {
      const existing = await db.getCard(card.id)
      if (!existing) return
      await db.setCard({
        ...existing,
        columnId: card.columnId,
        position: card.position,
        updatedAt: now,
      })
    })
  )
  for (const card of changed) sync.markDirty("cards", card.id)
}
