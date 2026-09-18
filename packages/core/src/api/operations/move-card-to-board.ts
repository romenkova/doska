import { byPosition } from "../../utils"
import { db } from "../db/db"
import { live } from "./live"
import { moveCardToColumn } from "./move-card-to-column"

/**
 * Moves a card to the top of another board's first column. Returns the id of
 * the card now holding the content — see {@link moveCardToColumn}.
 */
export async function moveCardToBoard(
  id: string,
  boardId: string
): Promise<string> {
  const cols = await db.getColumns()
  const [first] = cols
    .filter((c) => c.dashboardId === boardId && live(c))
    .sort(byPosition)
  if (!first) throw new Error("The board has no columns")
  return moveCardToColumn(id, first.id)
}
