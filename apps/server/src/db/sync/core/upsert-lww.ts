import { eq } from "drizzle-orm"
import type { PgColumn, PgTable } from "drizzle-orm/pg-core"
import type { Tx } from "../counter"

/**
 * Upserts one already-built `row` under last-writer-wins: writes only if it's
 * newer than what's stored (by `updatedAt`), keeping whatever `seq` the caller
 * stamped on it. Returns whether it wrote, so callers advance their counter
 * only on a real write — a change older than what we hold consumes nothing.
 */
export async function upsertLWW<T extends PgTable>(
  tx: Tx,
  table: T,
  idCol: PgColumn,
  updatedAtCol: PgColumn,
  row: T["$inferInsert"] & { id: string; updatedAt: number }
): Promise<boolean> {
  const [current] = await tx
    .select({ updatedAt: updatedAtCol })
    .from(table as PgTable)
    .where(eq(idCol, row.id))
    .limit(1)
  if (current && (current.updatedAt as number) >= row.updatedAt) return false
  await tx
    .insert(table)
    .values(row)
    .onConflictDoUpdate({ target: idCol, set: row })
  return true
}
