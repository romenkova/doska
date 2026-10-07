import type { HistoryEntry } from "../../types"
import { db } from "../db/db"

/** Newest first, including the rows of the cards a cross-board move copied this one from. */
export async function getHistory(entityId: string): Promise<HistoryEntry[]> {
  const entries: HistoryEntry[] = []
  let cardId: string | undefined = entityId

  while (cardId) {
    const rows = await db.getHistory(cardId)
    entries.push(...rows)

    const oldest = rows.at(-1)
    cardId =
      oldest?.action === "move"
        ? (oldest.data.fromCard as string | undefined)
        : undefined
  }

  return entries
}
