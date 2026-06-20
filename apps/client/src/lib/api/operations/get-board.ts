import type { Board } from "@/lib/types"
import { byPosition } from "@/lib/utils"
import { db } from "../db"
import { live } from "./live"

/** A board's columns plus the cards that live in them. */
export async function getBoard(deckId: string): Promise<Board> {
  const columns = (await db.getColumns())
    .filter((c) => c.dashboardId === deckId && live(c))
    .sort(byPosition)
  const columnIds = new Set(columns.map((c) => c.id))
  const cards = (await db.getCards()).filter(
    (c) => columnIds.has(c.columnId) && live(c)
  )
  return { columns, cards }
}
