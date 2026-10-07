import type { HistoryEntry } from "@doska/contract"
import { and, asc, eq, gt, isNotNull, isNull, or } from "drizzle-orm"
import { db } from "../../client"
import { boardMembers, dashboards, history } from "../../schema"
import { historyCounter } from "../constants"

export async function readSince(
  since: number,
  userId: string
): Promise<{ cursor: number; changes: HistoryEntry[] }> {
  const cursor = await historyCounter().read(db)

  const rows = await db
    .select({
      id: history.id,
      boardId: history.boardId,
      entityId: history.entityId,
      entityType: history.entityType,
      userId: history.userId,
      action: history.action,
      data: history.data,
      createdAt: history.createdAt,
      updatedAt: history.updatedAt,
    })
    .from(history)
    .innerJoin(dashboards, eq(dashboards.id, history.boardId))
    .leftJoin(
      boardMembers,
      and(
        eq(boardMembers.boardId, history.boardId),
        eq(boardMembers.userId, userId),
        isNull(boardMembers.revokedAt)
      )
    )
    .where(
      and(
        gt(history.seq, since),
        or(eq(dashboards.ownerId, userId), isNotNull(boardMembers.userId))
      )
    )
    .orderBy(asc(history.seq))

  const changes = rows.map((row) => ({ ...row, deletedAt: null }))
  return { cursor, changes }
}
