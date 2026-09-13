import { db } from "../db/db"
import { sync } from "../sync"
import { touchColumn } from "../sync/touch"

/** Persists a column's collapse state (card bodies hidden down to titles). */
export async function setColumnCollapsed(
  id: string,
  collapsed: boolean
): Promise<void> {
  const column = await db.getColumn(id)
  if (!column) return
  await db.setColumn(touchColumn({ ...column, collapsed }, ["collapsed"]))
  sync.markDirty("columns", id)
}
