import type { Column } from "@/lib/types"
import { db } from "../db/db"

/** The column a card lives in. */
export async function getCardCol(cardId: string): Promise<Column | null> {
  const card = await db.getCard(cardId)
  if (!card) return null
  const columns = await db.getColumns()
  return columns.find((c) => c.id === card.columnId) ?? null
}
