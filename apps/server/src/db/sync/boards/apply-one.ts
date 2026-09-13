import {
  CARD_FIELD_GROUP,
  COLUMN_FIELD_GROUP,
  type Change,
} from "@doska/contract"
import { mergeRecord } from "@doska/merge"
import { eq } from "drizzle-orm"
import { cards, columns } from "../../schema"
import { allocateCardNumber } from "../constants"
import type { Tx } from "../core/counter"
import { mergeCardBody, type CardRow } from "./merge-card-body"

type ColumnRow = typeof columns.$inferSelect

/**
 * Merges one board change into its table, group by group (see
 * `@doska/merge`), stamping `nextSeq`. Returns whether it wrote (i.e. consumed
 * a sequence number).
 */
export async function applyOne(
  tx: Tx,
  boardId: string,
  boardDeletedAt: number | null,
  change: Change,
  nextSeq: number
): Promise<boolean> {
  switch (change.store) {
    case "columns": {
      const { record } = change
      const [stored] = await tx
        .select()
        .from(columns)
        .where(eq(columns.id, record.id))
        .for("update")

      const incoming: ColumnRow = {
        id: record.id,
        boardId,
        title: record.title,
        position: record.position,
        collapsed: record.collapsed,
        color: record.color,
        done: record.done,
        updatedAt: record.updatedAt,
        deletedAt: record.deletedAt,
        stamps: record.stamps,
        seq: nextSeq,
      }
      const merged = mergeRecord(stored, incoming, COLUMN_FIELD_GROUP)
      if (!merged.changed) return false

      const row: ColumnRow = {
        ...merged.record,
        deletedAt: boardDeletedAt ?? merged.record.deletedAt,
        seq: nextSeq,
      }
      await tx
        .insert(columns)
        .values(row)
        .onConflictDoUpdate({ target: columns.id, set: row })
      return true
    }

    case "cards": {
      const { record, baseBody } = change
      const [stored] = await tx
        .select()
        .from(cards)
        .where(eq(cards.id, record.id))
        .for("update")

      const incoming: CardRow = {
        id: record.id,
        boardId,
        columnId: record.columnId,
        title: record.title,
        body: record.body,
        position: record.position,
        number: stored?.number ?? (await allocateCardNumber(tx, boardId)),
        deadline: record.deadline,
        priority: record.priority,
        attachments: record.attachments,
        updatedAt: record.updatedAt,
        deletedAt: record.deletedAt,
        stamps: record.stamps,
        bodyConflict: record.bodyConflict,
        seq: nextSeq,
      }
      let { record: card, changed } = mergeRecord(
        stored,
        incoming,
        CARD_FIELD_GROUP
      )
      if (stored && baseBody !== undefined && stored.body !== baseBody) {
        const bodyMerge = mergeCardBody(stored, incoming, baseBody, card)
        card = bodyMerge.record
        changed = changed || bodyMerge.changed
      }
      if (!changed) return false

      const row: CardRow = {
        ...card,
        deletedAt: boardDeletedAt ?? card.deletedAt,
        seq: nextSeq,
      }
      await tx
        .insert(cards)
        .values(row)
        .onConflictDoUpdate({ target: cards.id, set: row })
      return true
    }

    default:
      return false
  }
}
