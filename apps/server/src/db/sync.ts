import type { Change, DashboardChange } from "@deck/contract"
import { and, eq, gt } from "drizzle-orm"
import { db } from "./client"
import { boards, cards, columns, counters, dashboards } from "./schema"

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]

/** The `counters` row that orders dashboard-list changes account-wide. */
const DASHBOARDS_COUNTER = "dashboards"

/**
 * Upserts one change into its table under last-writer-wins, stamping `nextSeq`.
 * Returns whether it wrote (i.e. consumed a sequence number) — a change older
 * than what we already hold is ignored and consumes nothing.
 *
 * Dashboards aren't handled here: the list syncs on its own board-independent
 * channel ({@link applyDashboardPush}), so a stray dashboard change arriving on
 * the board channel is skipped rather than misfiled under the board's counter.
 */
async function applyOne(
  tx: Tx,
  boardId: string,
  change: Change,
  nextSeq: number
): Promise<boolean> {
  const { store, record } = change

  if (store === "dashboards") return false

  if (store === "columns") {
    const [current] = await tx
      .select({ updatedAt: columns.updatedAt })
      .from(columns)
      .where(eq(columns.id, record.id))
      .limit(1)
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
    await tx
      .insert(columns)
      .values(row)
      .onConflictDoUpdate({ target: columns.id, set: row })
    return true
  }

  const [current] = await tx
    .select({ updatedAt: cards.updatedAt })
    .from(cards)
    .where(eq(cards.id, record.id))
    .limit(1)
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
  await tx
    .insert(cards)
    .values(row)
    .onConflictDoUpdate({ target: cards.id, set: row })
  return true
}

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

/**
 * Applies a client's pushed dashboard-list changes under last-writer-wins,
 * bumping the account-level dashboards counter once per accepted write. Runs in
 * one transaction so the counter and the rows it stamps never drift apart.
 *
 * Mirrors {@link applyPush} but for the board-independent list channel: the
 * `seq` it stamps orders dashboards across every board, so any client can pull
 * the whole list past its cursor.
 */
export async function applyDashboardPush(
  changes: DashboardChange[]
): Promise<void> {
  if (changes.length === 0) return

  await db.transaction(async (tx) => {
    await tx
      .insert(counters)
      .values({ id: DASHBOARDS_COUNTER, value: 0 })
      .onConflictDoNothing()
    const [counter] = await tx
      .select({ value: counters.value })
      .from(counters)
      .where(eq(counters.id, DASHBOARDS_COUNTER))
      .limit(1)
    let seq = counter?.value ?? 0

    for (const { record } of changes) {
      const [current] = await tx
        .select({ updatedAt: dashboards.updatedAt })
        .from(dashboards)
        .where(eq(dashboards.id, record.id))
        .limit(1)
      if (current && current.updatedAt >= record.updatedAt) continue
      const row = {
        id: record.id,
        title: record.title,
        position: record.position,
        updatedAt: record.updatedAt,
        deletedAt: record.deletedAt,
        seq: seq + 1,
      }
      await tx
        .insert(dashboards)
        .values(row)
        .onConflictDoUpdate({ target: dashboards.id, set: row })
      seq += 1
    }

    await tx
      .update(counters)
      .set({ value: seq })
      .where(eq(counters.id, DASHBOARDS_COUNTER))
  })
}

/**
 * Returns every dashboard changed past `since`, plus the dashboards counter's
 * high-water mark to hand back as the next cursor. Board-independent: a client
 * gets every board's metadata regardless of which one it has open.
 */
export async function readDashboardsSince(since: number): Promise<{
  cursor: number
  changes: DashboardChange[]
}> {
  const [counter] = await db
    .select({ value: counters.value })
    .from(counters)
    .where(eq(counters.id, DASHBOARDS_COUNTER))
    .limit(1)
  const cursor = counter?.value ?? 0

  const changes: DashboardChange[] = []
  for (const r of await db
    .select()
    .from(dashboards)
    .where(gt(dashboards.seq, since))) {
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

  return { cursor, changes }
}

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
