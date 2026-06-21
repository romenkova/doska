import type { Change } from "@deck/contract"
import { eq } from "drizzle-orm"
import type { db } from "../client"
import { cards, columns } from "../schema"

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]

/**
 * Upserts one change into its table under last-writer-wins, stamping `nextSeq`.
 * Returns whether it wrote (i.e. consumed a sequence number) — a change older
 * than what we already hold is ignored and consumes nothing.
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

  if (store === "dashboards") return false

  if (store === "columns") {
    const [current] = await tx
      .select({ updatedAt: columns.updatedAt })
      .from(columns)
      .where(eq(columns.id, record.id))
      .limit(1)
    if (current && current.updatedAt >= record.updatedAt) return false
    const row = {
      id: record.id,
      boardId,
      title: record.title,
      position: record.position,
      updatedAt: record.updatedAt,
      deletedAt: record.deletedAt,
      seq: nextSeq,
    }
    await tx
      .insert(columns)
      .values(row)
      .onConflictDoUpdate({ target: columns.id, set: row })
    return true
  }

  const [current] = await tx
    .select({ updatedAt: cards.updatedAt })
    .from(cards)
    .where(eq(cards.id, record.id))
    .limit(1)
  if (current && current.updatedAt >= record.updatedAt) return false
  const row = {
    id: record.id,
    boardId,
    columnId: record.columnId,
    title: record.title,
    body: record.body,
    position: record.position,
    updatedAt: record.updatedAt,
    deletedAt: record.deletedAt,
    seq: nextSeq,
  }
  await tx
    .insert(cards)
    .values(row)
    .onConflictDoUpdate({ target: cards.id, set: row })
  return true
}
