import type { Change } from "@deck/contract"
import { and, eq, gt } from "drizzle-orm"
import { db } from "../client"
import { boards, cards, columns } from "../schema"

/**
 * Returns every column and card changed past `since` for the board, plus the
 * board's current high-water mark to hand back as the next cursor. The
 * dashboard's own metadata travels on {@link readDashboardsSince}, not here.
 */
export async function readSince(
  boardId: string,
  since: number
): Promise<{ cursor: number; changes: Change[] }> {
  const [board] = await db
    .select({ seq: boards.seqCounter })
    .from(boards)
    .where(eq(boards.id, boardId))
    .limit(1)
  const cursor = board?.seq ?? 0

  const changes: Change[] = []

  for (const r of await db
    .select()
    .from(columns)
    .where(and(eq(columns.boardId, boardId), gt(columns.seq, since)))) {
    changes.push({
      store: "columns",
      record: {
        id: r.id,
        title: r.title,
        position: r.position,
        dashboardId: r.boardId,
        updatedAt: r.updatedAt,
        deletedAt: r.deletedAt,
      },
    })
  }

  for (const r of await db
    .select()
    .from(cards)
    .where(and(eq(cards.boardId, boardId), gt(cards.seq, since)))) {
    changes.push({
      store: "cards",
      record: {
        id: r.id,
        title: r.title,
        body: r.body,
        position: r.position,
        columnId: r.columnId,
        updatedAt: r.updatedAt,
        deletedAt: r.deletedAt,
      },
    })
  }

  return { cursor, changes }
}
