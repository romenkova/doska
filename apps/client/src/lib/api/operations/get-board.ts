import type { Board } from "@/lib/types"
import { byPosition } from "@/lib/utils"
import { db } from "../db"
import { live } from "./live"

/** A board's columns plus the cards that live in them. */
export async function getBoard(deckId: string): Promise<Board> {
  const columns = (await db.getColumns())
    .filter((c) => c.dashboardId === deckId && live(c))
    .sort(byPosition)
  // One index seek per column (concurrent) reads only this board's cards,
  // instead of scanning every board's cards and filtering in JS.
  const cards = (await Promise.all(columns.map((c) => db.getCards(c.id))))
    .flat()
    .filter(live)
  return { columns, cards }
}
