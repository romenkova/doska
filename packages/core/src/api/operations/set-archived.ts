import { db } from "../db/db"
import { sync } from "../sync"
import { touchCard } from "../sync/touch"

export async function setCardsArchived(
  ids: string[],
  archived: boolean
): Promise<void> {
  for (const id of ids) {
    const card = await db.getCard(id)
    if (!card) continue
    await db.setCard(touchCard({ ...card, archived }, ["archived"]))
    sync.markDirty("cards", id)
  }
}
