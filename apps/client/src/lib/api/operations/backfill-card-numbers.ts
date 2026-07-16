import type { Card } from "@/lib/types"
import { db } from "../db/db"
import { sync } from "../sync"

/**
 * Assigns numbers to a board's cards that predate card ids, so their id shows
 * too. The server stamps new cards, but never re-touches existing ones, so a
 * client fills the gap: it numbers the unnumbered live cards after the board's
 * current max, and the server adopts those numbers on sync (see `applyOne`).
 *
 * Ordered by id so two devices backfilling the same board independently land on
 * the same numbers — no divergence to reconcile. `cards` is the board's live
 * set (already in the board cache); pass it in to avoid a re-read. Returns the
 * ids it numbered so the caller can refresh their views.
 */
export async function backfillCardNumbers(cards: Card[]): Promise<string[]> {
  const unnumbered = cards
    .filter((c) => c.number == null && c.deletedAt === null)
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
  if (unnumbered.length === 0) return []

  let next = cards.reduce((max, c) => Math.max(max, c.number ?? 0), 0)
  const numbered: string[] = []
  for (const card of unnumbered) {
    next += 1
    // Re-read under the current state: skip if a sync already numbered it.
    const stored = await db.getCard(card.id)
    if (!stored || stored.number != null) continue
    await db.setCard({ ...stored, number: next, updatedAt: Date.now() })
    sync.markDirty("cards", card.id)
    numbered.push(card.id)
  }
  return numbered
}
