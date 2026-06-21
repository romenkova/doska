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
      return this.read(tx)
    },
    async write(tx, seq) {
      await tx.update(counters).set({ value: seq }).where(eq(counters.id, id))
    },
  }
}

/** Per-board column/card counter. */
export const boardCounter = (boardId: string) => counter(boardCounterId(boardId))

/** Account-level dashboard-list counter. */
export const dashboardsCounter = () => counter(DASHBOARDS_COUNTER)
