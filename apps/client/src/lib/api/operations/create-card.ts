import { generateKeyBetween } from "fractional-indexing"
import { fallbackCard } from "@/lib/seed"
import { db } from "../db"
import { live } from "./live"
import { markDirty } from "../sync"

/** Creates an empty card at the top of a column and returns its new id. */
export async function createCard(columnId: string): Promise<string> {
  const id = `card-${crypto.randomUUID().slice(0, 8)}`
  const allCards = await db.getCards()
  const first = allCards
    .filter((c) => c.columnId === columnId && live(c))
    .reduce<
      string | null
    >((min, c) => (min === null || c.position < min ? c.position : min), null)
  const position = generateKeyBetween(null, first)
  await db.setCard({
    ...fallbackCard,
    id,
    columnId,
    position,
    updatedAt: Date.now(),
    deletedAt: null,
  })
  markDirty("cards", id)
  return id
}
