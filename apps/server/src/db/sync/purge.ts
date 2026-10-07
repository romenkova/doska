import { RETENTION_MS } from "@doska/contract"
import { and, inArray, isNotNull, lt } from "drizzle-orm"
import type { PgColumn } from "drizzle-orm/pg-core"
import { db } from "../client"
import { boardMembers, cards, columns, dashboards, history } from "../schema"

/** What one sweep removed, per table. */
export interface PurgeResult {
  cards: number
  columns: number
  dashboards: number
  members: number
  history: number
  /** Attachment object keys freed with the cards that held them. */
  attachments: string[]
}

/**
 * Hard-deletes tombstones past their retention window — the other half of the
 * client's own sweep. Both ends run it on their own schedule against the same
 * cutoff, so a purge never has to be announced: a client that pulled the
 * tombstone drops it too, and one that never pulled it has nothing to drop.
 *
 * The row is gone for good afterwards, which is also why the cutoff is
 * generous: a client offline past it and still holding an unpushed edit will
 * re-create the record rather than lose the edit.
 */
export async function purgeExpired(now = Date.now()): Promise<PurgeResult> {
  const cutoff = now - RETENTION_MS
  const expired = (deletedAt: PgColumn) =>
    and(isNotNull(deletedAt), lt(deletedAt, cutoff))

  // Cards first: their attachment keys have to be read before the rows go.
  const purgedCards = await db
    .delete(cards)
    .where(expired(cards.deletedAt))
    .returning({ attachments: cards.attachments })

  const purgedColumns = await db
    .delete(columns)
    .where(expired(columns.deletedAt))
    .returning({ id: columns.id })

  const purgedDashboards = await db
    .delete(dashboards)
    .where(expired(dashboards.deletedAt))
    .returning({ id: dashboards.id })

  // Membership rows are not tombstones — a revoked one is kept so its `seq`
  // can still be pulled — so they go only with the board they point at.
  const purgedMembers = purgedDashboards.length
    ? await db
        .delete(boardMembers)
        .where(
          inArray(
            boardMembers.boardId,
            purgedDashboards.map((d) => d.id)
          )
        )
        .returning({ userId: boardMembers.userId })
    : []

  const purgedHistory = await db
    .delete(history)
    .where(lt(history.createdAt, cutoff))
    .returning({ id: history.id })

  return {
    cards: purgedCards.length,
    columns: purgedColumns.length,
    dashboards: purgedDashboards.length,
    members: purgedMembers.length,
    history: purgedHistory.length,
    attachments: purgedCards.flatMap((c) => c.attachments.map((a) => a.key)),
  }
}
