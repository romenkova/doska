import { diffBody } from "@doska/merge"
import type { CardPatch } from "../../data/mutations/card"
import type { Card } from "../../types"
import { db } from "../db/db"
import { stamp } from "../sync/hlc"
import { currentUser, recordHistory, saveHistory } from "./record-history"

const MERGE_WINDOW_MS = 5 * 60 * 1000

export type EditData = { fields: string[]; added?: number; removed?: number }

function changedFields(before: Card, patch: CardPatch): string[] {
  return Object.entries(patch)
    .filter(([field]) => field !== "bodyConflict")
    .filter(
      ([field, value]) =>
        JSON.stringify(value) !== JSON.stringify(before[field as keyof Card])
    )
    .map(([field]) => field)
}

function countLines(before: string, after: string) {
  let added = 0
  let removed = 0
  // Without a trailing newline, appending to the last line counts it as removed and re-added.
  for (const line of diffBody(`${before}\n`, `${after}\n`)) {
    if (line.kind === "added") added += 1
    if (line.kind === "removed") removed += 1
  }
  return { added, removed }
}

function editData(fields: string[], added: number, removed: number): EditData {
  if (!fields.includes("body")) return { fields }
  return { fields, added, removed }
}

export async function recordEdit(
  card: Card,
  patch: CardPatch,
  before: Card
): Promise<void> {
  const fields = changedFields(before, patch)
  if (fields.length === 0) return

  const lines = fields.includes("body")
    ? countLines(before.body, card.body)
    : { added: 0, removed: 0 }

  const [last] = await db.getHistory(card.id)
  const userId = await currentUser()
  const canMerge =
    last !== undefined &&
    last.action === "edit" &&
    last.userId === userId &&
    Date.now() - last.createdAt < MERGE_WINDOW_MS

  if (canMerge) {
    const previous = last.data as EditData
    const data = editData(
      [...new Set([...previous.fields, ...fields])],
      (previous.added ?? 0) + lines.added,
      (previous.removed ?? 0) + lines.removed
    )
    await saveHistory({ ...last, data, updatedAt: stamp() })
    return
  }

  const column = await db.getColumn(card.columnId)
  if (!column) return

  await recordHistory.card(
    column.dashboardId,
    card.id,
    "edit",
    editData(fields, lines.added, lines.removed)
  )
}
