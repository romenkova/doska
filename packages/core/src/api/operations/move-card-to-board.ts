import { byPosition } from "../../utils"
import { db } from "../db/db"
import { live } from "./live"
import { moveCardToColumn } from "./move-card-to-column"

/**
 * Moves a card to the top of another board's first column
 */
export async function moveCardToBoard(
  id: string,
  boardId: string
): Promise<void> {
  const cols = await db.getColumns()
  const [first] = cols
    .filter((c) => c.dashboardId === boardId && live(c))
    .sort(byPosition)
  if (!first) throw new Error("The board has no columns")
  await moveCardToColumn(id, first.id)
}
