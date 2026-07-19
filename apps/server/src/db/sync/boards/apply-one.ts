import type { Change } from "@doska/contract"
import { eq } from "drizzle-orm"
import { cards, columns } from "../../schema"
import { upsertLWW } from "../core/upsert-lww"
import { allocateCardNumber } from "../constants"
import type { Tx } from "../core/counter"

/**
 * Upserts one board change into its table under last-writer-wins, stamping
 * `nextSeq`. Returns whether it wrote (i.e. consumed a sequence number).
 */
export async function applyOne(
  tx: Tx,
  boardId: string,
  boardDeletedAt: number | null,
  change: Change,
  nextSeq: number
): Promise<boolean> {
  const { store, record } = change
  const deletedAt = boardDeletedAt ?? record.deletedAt

  switch (store) {
    case "columns":
      return upsertLWW(tx, columns, columns.id, columns.updatedAt, {
        id: record.id,
        boardId,
        title: record.title,
        position: record.position,
        collapsed: record.collapsed,
        color: record.color,
        updatedAt: record.updatedAt,
        deletedAt,
        seq: nextSeq,
      })

    case "cards": {
      const [existing] = await tx
        .select({ number: cards.number })
        .from(cards)
        .where(eq(cards.id, record.id))
        .limit(1)

      const number = existing?.number ?? (await allocateCardNumber(tx, boardId))
      // A client can't know a number it hasn't pulled yet, so whenever the
      // stored one differs from what it pushed, the record it gets back is not
      // the record it sent. Advance the clock or its own copy ties on pull and
      // wins, and the number never reaches it.
      const updatedAt =
        number === record.number ? record.updatedAt : record.updatedAt + 1

      return upsertLWW(tx, cards, cards.id, cards.updatedAt, {
        id: record.id,
        boardId,
        columnId: record.columnId,
        title: record.title,
        body: record.body,
        position: record.position,
        number,
        deadline: record.deadline,
        attachments: record.attachments,
        updatedAt,
        deletedAt,
        seq: nextSeq,
      })
    }

    default:
      return false
  }
}
