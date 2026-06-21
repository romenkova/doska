import type { Change } from "@deck/contract"
import { eq } from "drizzle-orm"
import { applyOne } from "./apply-one"
import { boards } from "../schema"
import { db } from "../client"

/**
 * Applies a client's pushed changes under last-writer-wins, bumping the board's
 * sequence counter once per accepted write. Runs in one transaction so the
 * counter and the rows it stamps never drift apart.
 */
export async function applyPush(
  boardId: string,
  changes: Change[]
): Promise<void> {
  if (changes.length === 0) return

  await db.transaction(async (tx) => {
    await tx
      .insert(boards)
      .values({ id: boardId, seqCounter: 0 })
      .onConflictDoNothing()
    const [board] = await tx
      .select({ seq: boards.seqCounter })
      .from(boards)
      .where(eq(boards.id, boardId))
      .limit(1)
    let seq = board?.seq ?? 0

    for (const change of changes) {
      if (await applyOne(tx, boardId, change, seq + 1)) seq += 1
    }

    await tx
      .update(boards)
      .set({ seqCounter: seq })
      .where(eq(boards.id, boardId))
  })
}
