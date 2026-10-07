import { CARD_FIELD_GROUP } from "@doska/contract"
import type { Card } from "../../types"
import { db } from "../db/db"
import { recordEdit } from "../history/record-edit"
import { sync } from "../sync"
import { touchCard } from "../sync/touch"

/** Updates a card's own fields, preserving column and position. */
export async function updateCard(
  id: string,
  patch: Partial<
    Pick<
      Card,
      | "title"
      | "body"
      | "deadline"
      | "priority"
      | "tags"
      | "users"
      | "attachments"
      | "bodyConflict"
    >
  >
): Promise<void> {
  const existing = await db.getCard(id)
  if (!existing) return
  const fields = Object.keys(patch) as (keyof typeof patch)[]
  const groups = fields.map((field) => CARD_FIELD_GROUP[field])
  const card = touchCard({ ...existing, ...patch, id }, groups)
  await db.setCard(card)
  sync.markDirty("cards", id)
  await recordEdit(card, patch, existing)
}
