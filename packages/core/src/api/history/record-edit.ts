import type { CardPatch } from "../../data/mutations/card"
import type { Card, HistoryEntry } from "../../types"
import { db } from "../db/db"
import { stamp } from "../sync/hlc"
import { currentUser, recordHistory, saveHistory } from "./record-history"

const MERGE_WINDOW_MS = 5 * 60 * 1000

type Field = Exclude<keyof CardPatch, "bodyConflict">

type FieldChange =
  | { field: "body" }
  | { field: Field; from: string | string[]; to: string | string[] }

function changedFields(before: Card, patch: CardPatch): Field[] {
  return (Object.keys(patch) as (keyof CardPatch)[]).filter(
    (field): field is Field =>
      field !== "bodyConflict" &&
      JSON.stringify(patch[field]) !== JSON.stringify(before[field])
  )
}

function valueOf(card: Card, field: Exclude<Field, "body">) {
  if (field === "attachments")
    return card.attachments.map((attachment) => attachment.name)
  if (field === "deadline") return card.deadline ?? ""
  return card[field]
}

function changeOf(field: Field, before: Card, after: Card): FieldChange {
  if (field === "body") return { field }
  return { field, from: valueOf(before, field), to: valueOf(after, field) }
}

function canMerge(entry: HistoryEntry, userId: string | null): boolean {
  return (
    entry.userId === userId && Date.now() - entry.createdAt < MERGE_WINDOW_MS
  )
}

/** A new card is created untitled, so its first rows have no name until it gets one. */
async function nameUntitledRows(
  history: HistoryEntry[],
  userId: string | null,
  title: string
): Promise<void> {
  for (const entry of history) {
    if (entry.userId !== userId || entry.data.title !== "") continue
    await saveHistory({
      ...entry,
      data: { ...entry.data, title },
      updatedAt: stamp(),
    })
  }
}

export async function recordEdit(
  card: Card,
  patch: CardPatch,
  before: Card
): Promise<void> {
  const fields = changedFields(before, patch)
  if (fields.length === 0) return

  const column = await db.getColumn(card.columnId)
  if (!column) return

  const userId = await currentUser()
  const history = await db.getHistory(card.id)

  // Cards start empty, so one only counts as created once it gets content.
  if (history.length === 0 && before.title === "" && before.body === "") {
    await recordHistory.card(column.dashboardId, card.id, card.title, "create")
    return
  }

  if (before.title === "" && card.title !== "")
    await nameUntitledRows(history, userId, card.title)

  for (const field of fields) {
    // Naming a new card isn't a rename; its create row just got the title.
    if (field === "title" && before.title === "") continue

    const change = changeOf(field, before, card)
    const last = history.find((entry) => entry.data.field === field)

    if (last && canMerge(last, userId)) {
      // Keeps the first `from`, so the row spans every edit in the window.
      await saveHistory({
        ...last,
        data: {
          ...last.data,
          ...change,
          from: last.data.from,
          title: card.title,
        },
        updatedAt: stamp(),
      })
    } else {
      const action = field === "title" ? "rename" : "edit"
      await recordHistory.card(
        column.dashboardId,
        card.id,
        card.title,
        action,
        change
      )
    }
  }
}
