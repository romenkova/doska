import type { Change } from "@deck/contract"
import type { Tx } from "./counter"
import { cards, columns } from "../schema"
import { upsertLWW } from "./core/upsert-lww"

/**
 * Upserts one board change into its table under last-writer-wins, stamping
 * `nextSeq`. Returns whether it wrote (i.e. consumed a sequence number).
 *
 * Dashboards aren't handled here: the list syncs on its own board-independent
 * channel ({@link applyDashboardPush}), so a stray dashboard change arriving on
 * the board channel is skipped rather than misfiled under the board's counter.
 */
export async function applyOne(
  tx: Tx,
  boardId: string,
  change: Change,
  nextSeq: number
): Promise<boolean> {
  const { store, record } = change

  if (store === "columns") {
    return upsertLWW(tx, columns, columns.id, columns.updatedAt, {
      id: record.id,
      boardId,
      title: record.title,
      position: record.position,
      updatedAt: record.updatedAt,
      deletedAt: record.deletedAt,
      seq: nextSeq,
    })
  }

  if (store === "cards") {
    return upsertLWW(tx, cards, cards.id, cards.updatedAt, {
      id: record.id,
      boardId,
      columnId: record.columnId,
      title: record.title,
      body: record.body,
      position: record.position,
      updatedAt: record.updatedAt,
      deletedAt: record.deletedAt,
      seq: nextSeq,
    })
  }

  return false
}
