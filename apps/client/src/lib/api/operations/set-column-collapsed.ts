import { db } from "../db/db"
import { sync } from "../sync"

/** Persists a column's collapse state (card bodies hidden down to titles). */
export async function setColumnCollapsed(
  id: string,
  collapsed: boolean
): Promise<void> {
  const column = (await db.getColumns()).find((c) => c.id === id)
  if (!column) return
  await db.setColumn({ ...column, collapsed, updatedAt: Date.now() })
  sync.markDirty("columns", id)
}
