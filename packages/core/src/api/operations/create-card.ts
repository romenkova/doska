import { CARD_GROUPS } from "@doska/contract"
import { generateKeyBetween } from "fractional-indexing"
import { fallbackCard } from "../../seed"
import { db } from "../db/db"
import { newId } from "./new-id"
import { live } from "./live"
import { sync } from "../sync"
import { touchCard } from "../sync/touch"

/** Creates an empty card at the top of a column and returns its new id. */
export async function createCard(columnId: string): Promise<string> {
  const column = await db.getColumn(columnId)
  if (!column || !live(column))
    throw new Error(`createCard: no live column ${columnId}`)

  const id = newId("card")
  const cards = await db.getCards(columnId)
  const first = cards
    .filter(live)
    .reduce<string | null>(
      (min, c) => (min === null || c.position < min ? c.position : min),
      null
    )
  const position = generateKeyBetween(null, first)
  const card = {
    ...fallbackCard,
    id,
    columnId,
    position,
    title: "",
    deletedAt: null,
  }
  await db.setCard(touchCard(card, CARD_GROUPS))
  sync.markDirty("cards", id)
  return id
}
