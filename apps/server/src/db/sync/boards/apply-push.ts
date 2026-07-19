import type { Change } from "@doska/contract"
import { eq } from "drizzle-orm"
import { dashboards } from "../../schema"
import { applyChanges } from "../core/apply-changes"
import { applyOne } from "./apply-one"
import type { Tx } from "../core/counter"
import { boardCounter } from "../constants"

/**
 * Applies a client's pushed board changes under last-writer-wins, bumping the
 * board's counter once per accepted write.
 *
 * Reads the board's own tombstone once and cascades it onto every column/card
 * in the push (see {@link applyOneBoard}): a board is a dashboard, so a deleted board
 * must never gain live contents from a peer that hasn't yet pulled the deletion.
 * The state is read inside the transaction and memoized — a board can't change
 * deletion status within one push.
 */
export function applyPush(boardId: string, changes: Change[]): Promise<void> {
  let boardDeletedAt: number | null | undefined
  return applyChanges(
    boardCounter(boardId),
    changes,
    async (tx, change, nextSeq) => {
      if (boardDeletedAt === undefined)
        boardDeletedAt = await readBoardDeletedAt(tx, boardId)
      return applyOne(tx, boardId, boardDeletedAt, change, nextSeq)
    }
  )
}

/** The board's (= dashboard's) tombstone, or null if it's live or unknown. */
async function readBoardDeletedAt(
  tx: Tx,
  boardId: string
): Promise<number | null> {
  const [row] = await tx
    .select({ deletedAt: dashboards.deletedAt })
    .from(dashboards)
    .where(eq(dashboards.id, boardId))
    .limit(1)
  return row?.deletedAt ?? null
}
