import { eq } from "drizzle-orm"
import { db } from "../client"
import { counters } from "../schema"

/** A live transaction handle, as passed to {@link db.transaction}'s callback. */
export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]

/** Anything that can run a read — the pooled `db` or an open transaction. */
type Querier = typeof db | Tx

/** The `counters` row that orders dashboard-list changes account-wide. */
export const DASHBOARDS_COUNTER = "dashboards"

/** The `counters` row that orders one board's column/card changes. */
const boardCounterId = (boardId: string) => `board:${boardId}`

/**
 * A monotonic high-water mark behind a sync channel: a named row in `counters`
 * that orders that channel's writes. The read/apply engines stay generic over
 * which channel they drive by talking to one of these instead of a table.
 */
export interface SeqCounter {
  /** Current value, or 0 if the counter row doesn't exist yet. */
  read(q: Querier): Promise<number>
  /** Lazily create the counter row, then return its current value. */
  ensure(tx: Tx): Promise<number>
  /** Persist a new high-water mark. */
  write(tx: Tx, seq: number): Promise<void>
}

/** The counter for a sync channel, keyed by its `counters` row id. */
function counter(id: string): SeqCounter {
  return {
    async read(q) {
      const [row] = await q
        .select({ value: counters.value })
        .from(counters)
        .where(eq(counters.id, id))
        .limit(1)
      return row?.value ?? 0
    },
    async ensure(tx) {
      await tx.insert(counters).values({ id, value: 0 }).onConflictDoNothing()
      const [row] = await tx
        .select({ value: counters.value })
        .from(counters)
        .where(eq(counters.id, id))
        .for("update")
      return row?.value ?? 0
    },
    async write(tx, seq) {
      await tx.update(counters).set({ value: seq }).where(eq(counters.id, id))
    },
  }
}

/** Per-board column/card counter. */
export const boardCounter = (boardId: string) =>
  counter(boardCounterId(boardId))

/** Account-level dashboard-list counter. */
export const dashboardsCounter = () => counter(DASHBOARDS_COUNTER)

/** The `counters` row holding a board's next human-readable card number. */
const cardNumberCounterId = (boardId: string) => `cardno:${boardId}`

/**
 * Allocates the next human-readable card number for a board (the `12` in
 * `ROAD-12`), starting at 1. Distinct from the board's sync counter: this ticks
 * only when a brand-new card is first inserted, never on updates, so the numbers
 * stay dense and stable. Runs inside the apply transaction, taking the counter
 * row's `FOR UPDATE` lock so concurrent inserts can't hand out the same number.
 */
export async function allocateCardNumber(
  tx: Tx,
  boardId: string
): Promise<number> {
  const c = counter(cardNumberCounterId(boardId))
  const next = (await c.ensure(tx)) + 1
  await c.write(tx, next)
  return next
}

/**
 * Raises a board's card-number counter to at least `n`, so a number the server
 * adopted from a client (a legacy backfill) can never be handed out again by a
 * later {@link allocateCardNumber}.
 */
export async function ensureCardNumberAtLeast(
  tx: Tx,
  boardId: string,
  n: number
): Promise<void> {
  const c = counter(cardNumberCounterId(boardId))
  if (n > (await c.ensure(tx))) await c.write(tx, n)
}
