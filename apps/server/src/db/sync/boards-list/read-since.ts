import type { DashboardChange } from "@doska/contract"
import {
  and,
  eq,
  getTableColumns,
  gt,
  isNotNull,
  isNull,
  or,
} from "drizzle-orm"
import { db } from "../../client"
import { boardMembers, dashboards, sidebarLayouts } from "../../schema"
import { boardsListCounter } from "../constants"

/**
 * Returns every dashboard `userId` can reach that changed past `since` — owned
 * or shared with them — plus the ids of boards they have just lost, plus their
 * sidebar layout if it changed, plus the dashboards counter's high-water mark
 * to hand back as the next cursor. Board-independent: a client gets the
 * metadata of every board it can reach, regardless of which one it has open.
 */
export async function readSince(
  since: number,
  userId: string
): Promise<{
  cursor: number
  changes: DashboardChange[]
  removed: string[]
}> {
  const cursor = await boardsListCounter().read(db)

  const changes: DashboardChange[] = []
  for (const r of await db
    .select(getTableColumns(dashboards))
    .from(dashboards)
    .leftJoin(
      boardMembers,
      and(
        eq(boardMembers.boardId, dashboards.id),
        eq(boardMembers.userId, userId),
        isNull(boardMembers.revokedAt)
      )
    )
    .where(
      and(
        or(eq(dashboards.ownerId, userId), isNotNull(boardMembers.userId)),
        or(gt(dashboards.seq, since), gt(boardMembers.seq, since))
      )
    )) {
    changes.push({
      store: "dashboards",
      record: {
        id: r.id,
        title: r.title,
        position: r.position,
        sort: r.sort,
        updatedAt: r.updatedAt,
        deletedAt: r.deletedAt,
      },
    })
  }

  const [layout] = await db
    .select({
      items: sidebarLayouts.items,
      updatedAt: sidebarLayouts.updatedAt,
    })
    .from(sidebarLayouts)
    .where(
      and(eq(sidebarLayouts.userId, userId), gt(sidebarLayouts.seq, since))
    )
  if (layout) {
    changes.push({
      store: "sidebar",
      record: {
        id: "layout",
        items: layout.items,
        updatedAt: layout.updatedAt,
        deletedAt: null,
      },
    })
  }

  const removed = (
    await db
      .select({ boardId: boardMembers.boardId })
      .from(boardMembers)
      .where(
        and(
          eq(boardMembers.userId, userId),
          isNotNull(boardMembers.revokedAt),
          gt(boardMembers.seq, since)
        )
      )
  ).map((r) => r.boardId)

  return { cursor, changes, removed }
}
