import { RETENTION_MS } from "@doska/contract"
import { db } from "../db/db"

/** What a board has tombstoned. A file naming anything else is new to it. */
export interface DeletedIds {
  columns: string[]
  cards: string[]
}

/**
 * Ids the board deleted, live ones excluded. The vault needs the difference
 * between a record this board threw away and one it has simply never seen.
 * Expired tombstones count as gone already.
 */
export async function getDeletedIds(deckId: string): Promise<DeletedIds> {
  const cutoff = Date.now() - RETENTION_MS
  const inTrash = (r: { deletedAt: number | null }) =>
    r.deletedAt !== null && r.deletedAt >= cutoff

  const mine = (await db.getColumns()).filter((c) => c.dashboardId === deckId)
  const cards = (await Promise.all(mine.map((c) => db.getCards(c.id)))).flat()
  return {
    columns: mine.filter(inTrash).map((c) => c.id),
    cards: cards.filter(inTrash).map((c) => c.id),
  }
}
