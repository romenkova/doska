import type { HistoryEntry } from "../../types"
import { db } from "../db/db"
import { live } from "../operations/live"

const ACTIVITY_LIMIT = 200

/** Newest first, including the rows of the cards a cross-board move copied this one from. */
export async function getHistory(entityId: string): Promise<HistoryEntry[]> {
  const entries: HistoryEntry[] = []
  let cardId: string | undefined = entityId

  while (cardId) {
    const rows = await db.getHistory(cardId)
    // The old board's copy of a move; the new card's own move row already says it.
    entries.push(...rows.filter((entry) => !entry.data.toCard))

    const oldest = rows.at(-1)
    cardId =
      oldest?.action === "move"
        ? (oldest.data.fromCard as string | undefined)
        : undefined
  }

  return entries
}

/** Newest first: the board's own rows and those of every column and card on it. */
export async function getBoardHistory(
  boardId: string
): Promise<HistoryEntry[]> {
  const entries = await db.getAllHistory()
  return entries.filter((entry) => entry.boardId === boardId)
}

/** The newest rows across every board still in the local list. */
export async function getActivity(): Promise<HistoryEntry[]> {
  const entries = (await db.getAllHistory()).slice(0, ACTIVITY_LIMIT)
  const boards = await db.getDashboards()
  const liveBoardIds = boards.filter(live).map((board) => board.id)
  const movedCardIds = entries.map((entry) => entry.data.fromCard)

  return entries.filter(
    (entry) =>
      liveBoardIds.includes(entry.boardId) &&
      // Someone on both boards already has the new board's row for this move.
      !(entry.data.toCard && movedCardIds.includes(entry.entityId))
  )
}
