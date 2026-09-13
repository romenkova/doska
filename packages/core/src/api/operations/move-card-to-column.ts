import { generateKeyBetween } from "fractional-indexing"
import { byPosition } from "../../utils"
import { db } from "../db/db"
import { sync } from "../sync"
import { touchCard } from "../sync/touch"
import { live } from "./live"

/**
 * Moves a card to the top of another column, for callers that know the
 * destination but not what's in it — the digest loads no board, so it can't
 * mint a position the way a drag does.
 */
export async function moveCardToColumn(
  id: string,
  columnId: string
): Promise<void> {
  const card = await db.getCard(id)
  if (!card) return

  const cards = (await db.getCards(columnId)).filter(live).sort(byPosition)
  const position = generateKeyBetween(null, cards[0]?.position ?? null)

  await db.setCard(touchCard({ ...card, columnId, position }, ["place"]))
  sync.markDirty("cards", id)
}
