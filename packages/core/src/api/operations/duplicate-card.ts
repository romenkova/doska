import { CARD_GROUPS } from "@doska/contract"
import { generateKeyBetween } from "fractional-indexing"
import { db } from "../db/db"
import { newId } from "./new-id"
import { live } from "./live"
import { sync } from "../sync"
import { touchCard } from "../sync/touch"

/** Copies a card to just below itself and returns the copy's id. */
export async function duplicateCard(id: string): Promise<string> {
  const source = await db.getCard(id)
  if (!source || !live(source))
    throw new Error(`duplicateCard: no live card ${id}`)

  const siblings = await db.getCards(source.columnId)
  const next = siblings
    .filter(live)
    .reduce<string | null>(
      (min, c) =>
        c.position > source.position && (min === null || c.position < min)
          ? c.position
          : min,
      null
    )

  const copyId = newId("card")
  const card = touchCard(
    {
      ...source,
      id: copyId,
      position: generateKeyBetween(source.position, next),
      number: null,
      attachments: [],
      template: false,
      bodyConflict: null,
      updatedAt: 0,
      stamps: {},
    },
    CARD_GROUPS
  )
  await db.setCard(card)
  sync.markDirty("cards", copyId)
  return copyId
}
