import { generateKeyBetween } from "fractional-indexing"
import { fallbackCard } from "@/lib/seed"
import { db } from "../db/db"
import { live } from "./live"
import { sync } from "../sync"
import { stamp } from "../sync/hlc"

/** Creates an empty card at the top of a column and returns its new id. */
export async function createCard(columnId: string): Promise<string> {
  const id = `card-${crypto.randomUUID().slice(0, 8)}`
  const cards = await db.getCards(columnId)
  const first = cards
    .filter(live)
    .reduce<
      string | null
    >((min, c) => (min === null || c.position < min ? c.position : min), null)
  const position = generateKeyBetween(null, first)
  await db.setCard({
    ...fallbackCard,
    id,
    columnId,
    position,
    title: "",
    updatedAt: stamp(),
    deletedAt: null,
  })
  sync.markDirty("cards", id)
  return id
}
