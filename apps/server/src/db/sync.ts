import type { Change } from "@deck/contract"
import { and, eq, gt } from "drizzle-orm"
import { db } from "./client"
import { boards, cards, columns, dashboards } from "./schema"

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]

/**
 * Upserts one change into its table under last-writer-wins, stamping `nextSeq`.
 * Returns whether it wrote (i.e. consumed a sequence number) — a change older
 * than what we already hold is ignored and consumes nothing.
 */
function applyOne(
  tx: Tx,
  boardId: string,
  change: Change,
  nextSeq: number
): boolean {
  const { store, record } = change

  if (store === "dashboards") {
    const current = tx
      .select({ updatedAt: dashboards.updatedAt })
      .from(dashboards)
      .where(eq(dashboards.id, record.id))
      .get()
    if (current && current.updatedAt >= record.updatedAt) return false
    const row = {
      id: record.id,
      title: record.title,
      position: record.position,
      updatedAt: record.updatedAt,
      deletedAt: record.deletedAt,
      seq: nextSeq,
    }
    tx.insert(dashboards)
      .values(row)
      .onConflictDoUpdate({ target: dashboards.id, set: row })
      .run()
    return true
  }

  if (store === "columns") {
    const current = tx
      .select({ updatedAt: columns.updatedAt })
      .from(columns)
      .where(eq(columns.id, record.id))
      .get()
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
    tx.insert(columns)
      .values(row)
      .onConflictDoUpdate({ target: columns.id, set: row })
      .run()
    return true
  }

  const current = tx
    .select({ updatedAt: cards.updatedAt })
    .from(cards)
    .where(eq(cards.id, record.id))
    .get()
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
  tx.insert(cards)
    .values(row)
    .onConflictDoUpdate({ target: cards.id, set: row })
    .run()
  return true
}

/**
 * Applies a client's pushed changes under last-writer-wins, bumping the board's
 * sequence counter once per accepted write. Runs in one transaction so the
 * counter and the rows it stamps never drift apart.
 */
export function applyPush(boardId: string, changes: Change[]): void {
  if (changes.length === 0) return

  db.transaction((tx) => {
    tx.insert(boards)
      .values({ id: boardId, seqCounter: 0 })
      .onConflictDoNothing()
      .run()
    const board = tx
      .select({ seq: boards.seqCounter })
      .from(boards)
      .where(eq(boards.id, boardId))
      .get()
    let seq = board?.seq ?? 0

    for (const change of changes) {
      if (applyOne(tx, boardId, change, seq + 1)) seq += 1
    }

    tx.update(boards)
      .set({ seqCounter: seq })
      .where(eq(boards.id, boardId))
      .run()
  })
}

/**
 * Returns every record changed past `since` across the three tables, plus the
 * board's current high-water mark to hand back as the next cursor.
 */
export function readSince(
  boardId: string,
  since: number
): { cursor: number; changes: Change[] } {
  const board = db
    .select({ seq: boards.seqCounter })
    .from(boards)
    .where(eq(boards.id, boardId))
    .get()
  const cursor = board?.seq ?? 0

  const changes: Change[] = []

  for (const r of db
    .select()
    .from(dashboards)
    .where(and(eq(dashboards.id, boardId), gt(dashboards.seq, since)))
    .all()) {
    changes.push({
      store: "dashboards",
      record: {
        id: r.id,
        title: r.title,
        position: r.position,
        updatedAt: r.updatedAt,
        deletedAt: r.deletedAt,
      },
    })
  }

  for (const r of db
    .select()
    .from(columns)
    .where(and(eq(columns.boardId, boardId), gt(columns.seq, since)))
    .all()) {
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

  for (const r of db
    .select()
    .from(cards)
    .where(and(eq(cards.boardId, boardId), gt(cards.seq, since)))
    .all()) {
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
