import { db } from "../db/db"

/** The board a card belongs to. */
export interface CardDeck {
  id: string
  prefix: string
}

/**
 * Walks a card back to its board through its column. The digest opens cards
 * from boards other than the one the app is pointed at, so the card panel has
 * to resolve its own deck rather than inherit the route's.
 */
export async function getCardDeck(cardId: string): Promise<CardDeck | null> {
  const card = await db.getCard(cardId)
  if (!card) return null
  const columns = await db.getColumns()
  const column = columns.find((c) => c.id === card.columnId)
  if (!column) return null
  const dashboards = await db.getDashboards()
  const board = dashboards.find((d) => d.id === column.dashboardId)
  return board ? { id: board.id, prefix: board.prefix } : null
}
