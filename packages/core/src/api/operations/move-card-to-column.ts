import { CARD_GROUPS } from "@doska/contract"
import { generateKeyBetween } from "fractional-indexing"
import { byPosition } from "../../utils"
import { db } from "../db/db"
import { recordHistory } from "../history/record-history"
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

  const to = await db.getColumn(columnId)
  if (!to || !live(to)) return id

  const cards = (await db.getCards(columnId)).filter(live).sort(byPosition)
  const position = generateKeyBetween(null, cards[0]?.position ?? null)

  const from = await db.getColumn(card.columnId)
  if (!from || from.dashboardId === to.dashboardId) {
    await db.setCard(touchCard({ ...card, columnId, position }, ["place"]))
    sync.markDirty("cards", id)
    if (from && from.id !== to.id)
      await recordHistory.card(to.dashboardId, id, card.title, "move", {
        from: from.title,
        to: to.title,
      })
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

  const fromBoard = await db.getDashboard(from.dashboardId)
  const toBoard = await db.getDashboard(to.dashboardId)
  await recordHistory.card(to.dashboardId, copyId, card.title, "move", {
    from: from.title,
    to: to.title,
    fromBoard: fromBoard?.title ?? "",
    toBoard: toBoard?.title ?? "",
    fromCard: id,
  })
  return copyId
}
