import type { Change } from "@doska/contract"
import { and, eq, gt } from "drizzle-orm"
import { db } from "../../client"
import { cards, columns } from "../../schema"
import { boardCounter } from "../constants"

/**
 * Returns every column and card changed past `since` for the board, plus the
 * board's current high-water mark to hand back as the next cursor. The
 * dashboard's own metadata travels on {@link readDashboardsSince}, not here.
 */
export async function readSince(
  boardId: string,
  since: number
): Promise<{ cursor: number; changes: Change[] }> {
  const cursor = await boardCounter(boardId).read(db)

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
        collapsed: r.collapsed,
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
        number: r.number,
        deadline: r.deadline,
        attachments: r.attachments,
        updatedAt: r.updatedAt,
        deletedAt: r.deletedAt,
      },
    })
  }

  return { cursor, changes }
}
