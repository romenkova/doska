import type { HistoryEntry } from "@doska/contract"
import { and, eq, lt } from "drizzle-orm"
import { assertBoardAccess } from "../../access"
import { history } from "../../schema"
import { applyChanges } from "../core/apply-changes"
import { historyCounter } from "../constants"

export async function applyPush(
  entries: HistoryEntry[],
  userId: string
): Promise<void> {
  const boardIds = new Set(entries.map((entry) => entry.boardId))
  for (const boardId of boardIds) await assertBoardAccess(userId, boardId)

  return applyChanges(historyCounter(), entries, async (tx, entry, nextSeq) => {
    const written = await tx
      .insert(history)
      .values({
        id: entry.id,
        boardId: entry.boardId,
        entityId: entry.entityId,
        entityType: entry.entityType,
        userId,
        action: entry.action,
        data: entry.data,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
        seq: nextSeq,
      })
      .onConflictDoUpdate({
        target: history.id,
        set: { data: entry.data, updatedAt: entry.updatedAt, seq: nextSeq },
        setWhere: and(
          lt(history.updatedAt, entry.updatedAt),
          eq(history.userId, userId)
        ),
      })
      .returning({ id: history.id })
    return written.length > 0
  })
}
