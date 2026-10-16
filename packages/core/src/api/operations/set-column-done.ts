import { db } from "../db/db"
import { sync } from "../sync"
import { stamp } from "../sync/hlc"
import { touchColumn } from "../sync/touch"

/**
 * Marks the column whose cards count as finished.
 */
export async function setColumnDone(id: string, done: boolean): Promise<void> {
  const column = await db.getColumn(id)
  if (!column) return

  const now = stamp()
  await db.setColumn(touchColumn({ ...column, done }, ["done"], now))
  sync.markDirty("columns", id)
}
