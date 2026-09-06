import { lt } from "drizzle-orm"
import type { PgColumn, PgTable } from "drizzle-orm/pg-core"
import type { Tx } from "./counter"

/**
 * Upserts one already-built `row` under last-writer-wins: writes only if it's
 * newer than what's stored (by `updatedAt`), keeping whatever `seq` the caller
 * stamped on it. Returns whether it wrote, so callers advance their counter
 * only on a real write — a change older than what we hold consumes nothing.
 *
 * `insertOnly` names columns to drop from the conflict `set`, for values that
 * belong to whoever created the row and must survive every later push.
 */
export async function upsertLWW<T extends PgTable>(
  tx: Tx,
  table: T,
  idCol: PgColumn,
  updatedAtCol: PgColumn,
  row: T["$inferInsert"] & { updatedAt: number },
  insertOnly: (keyof T["$inferInsert"])[] = []
): Promise<boolean> {
  const set = { ...row }
  for (const key of insertOnly) delete set[key]

  const written = await tx
    .insert(table)
    .values(row)
    .onConflictDoUpdate({
      target: idCol,
      set,
      setWhere: lt(updatedAtCol, row.updatedAt),
    })
    .returning({ id: idCol })
  return written.length > 0
}
