import { CARD_GROUPS } from "@doska/contract"
import { generateKeyBetween } from "fractional-indexing"
import { byPosition } from "../../utils"
import { db } from "../db/db"
import { sync } from "../sync"
import { touchCard } from "../sync/touch"
import { live } from "./live"
import { newId } from "./new-id"

/**
 * Moves a card to the top of another column, for callers that know the
 * destination but not what's in it — the digest loads no board, so it can't
 * mint a position the way a drag does. Returns the id of the card that now
 * holds the content.
 *
 * Across boards that is a fresh id: the server files a card under the board it
 * was first pushed to and never re-files it, so the card is copied onto the new
 * board and the original tombstoned.
 */
export async function moveCardToColumn(
  id: string,
  columnId: string
): Promise<string> {
  const card = await db.getCard(id)
  if (!card) return id

  const cards = (await db.getCards(columnId)).filter(live).sort(byPosition)
  const position = generateKeyBetween(null, cards[0]?.position ?? null)

  const [from, to] = await Promise.all([
    db.getColumn(card.columnId),
    db.getColumn(columnId),
  ])
  if (!from || !to || from.dashboardId === to.dashboardId) {
    await db.setCard(touchCard({ ...card, columnId, position }, ["place"]))
    sync.markDirty("cards", id)
    return id
  }

  const copyId = newId("card")
  await db.setCard(
    touchCard(
      { ...card, id: copyId, columnId, position, number: null },
      CARD_GROUPS
    )
  )
  sync.markDirty("cards", copyId)
  // Emptied first
  await db.softDeleteCard(
    touchCard({ ...card, title: "", body: "", attachments: [] }, [
      "title",
      "body",
      "attachments",
    ])
  )
  sync.markDirty("cards", id)
  return copyId
}
