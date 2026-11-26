import type { Card } from "../../types"
import { CARDS, HISTORY } from "../constants"
import { db } from "../db/db"
import { sync } from "../sync"
import { deleteCard } from "./delete-card"
import { live } from "./live"

export function isBlankCard(
  card: Pick<Card, "title" | "body" | "attachments">
): boolean {
  return (
    !card.title.trim() && !card.body.trim() && card.attachments.length === 0
  )
}

export async function discardCard(deckId: string, id: string): Promise<void> {
  const card = await db.getCard(id)
  if (!card) return
  // Numbered on first sync, so without one the server never saw it.
  if (card.number === null) {
    const historyIds = (await db.getHistory(id)).map((entry) => entry.id)
    sync.dropDirty(CARDS, [id])
    sync.dropDirty(HISTORY, historyIds)
    await db.hardDelete(CARDS, id)
    for (const entryId of historyIds) {
      await db.hardDelete(HISTORY, entryId)
    }

    return
  }

  await deleteCard(deckId, id)
}

export async function discardIfBlank(deckId: string, id: string) {
  const card = await db.getCard(id)
  if (card && live(card) && isBlankCard(card)) await discardCard(deckId, id)
}
