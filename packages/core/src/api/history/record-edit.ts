import type { CardPatch } from "../../data/mutations/card"
import type { Card } from "../../types"
import { db } from "../db/db"
import { currentUser, recordHistory } from "./record-history"

const MERGE_WINDOW_MS = 5 * 60 * 1000

function hasChanges(before: Card, patch: CardPatch): boolean {
  return Object.entries(patch)
    .filter(([field]) => field !== "bodyConflict")
    .some(
      ([field, value]) =>
        JSON.stringify(value) !== JSON.stringify(before[field as keyof Card])
    )
}

export async function recordEdit(
  card: Card,
  patch: CardPatch,
  before: Card
): Promise<void> {
  if (!hasChanges(before, patch)) return

  const [last] = await db.getHistory(card.id)
  const userId = await currentUser()
  const editedJustNow =
    last !== undefined &&
    last.action === "edit" &&
    last.userId === userId &&
    Date.now() - last.createdAt < MERGE_WINDOW_MS
  if (editedJustNow) return

  const column = await db.getColumn(card.columnId)
  if (!column) return

  await recordHistory.card(column.dashboardId, card.id, "edit")
}
