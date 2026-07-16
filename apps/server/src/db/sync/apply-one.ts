import type { Change } from "@doska/contract"
import { eq } from "drizzle-orm"
import { allocateCardNumber, type Tx } from "./counter"
import { cards, columns } from "../schema"
import { upsertLWW } from "./core/upsert-lww"

/**
 * Upserts one board change into its table under last-writer-wins, stamping
 * `nextSeq`. Returns whether it wrote (i.e. consumed a sequence number).
 *
 * `boardDeletedAt` is the owning board's tombstone (null = live). When set, the
 * change is cascaded dead: a peer that hadn't yet pulled the board's deletion
 * can still push live columns/cards for it, and without this they'd be stored
 * live — unreachable orphans under a deleted board. Born dead here, they're
 * persisted (and pulled back by every client) as tombstones instead.
 *
 * Dashboards aren't handled here: the list syncs on its own board-independent
 * channel ({@link applyDashboardPush}), so a stray dashboard change arriving on
 * the board channel is skipped rather than misfiled under the board's counter.
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

  if (store === "columns") {
    return upsertLWW(tx, columns, columns.id, columns.updatedAt, {
      id: record.id,
      boardId,
      title: record.title,
      position: record.position,
      collapsed: record.collapsed,
      updatedAt: record.updatedAt,
      deletedAt,
      seq: nextSeq,
    })
  }

  if (store === "cards") {
    const [existing] = await tx
      .select({ number: cards.number })
      .from(cards)
      .where(eq(cards.id, record.id))
      .limit(1)
    // A card's number is stamped once by the server, then fixed: keep what we
    // already hold, else allocate. A client-supplied number is ignored — a
    // client that restamps `updatedAt` to carry one would launder stale record
    // contents past LWW. Allocation nudges `updatedAt` so the stamp rides back
    // to the creator (LWW skips equal timestamps).
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

  return false
}
