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

      let number = existing?.number ?? null
      let updatedAt = record.updatedAt
      if (number === null) {
        number = await allocateCardNumber(tx, boardId)
        updatedAt = record.updatedAt + 1
      }

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
