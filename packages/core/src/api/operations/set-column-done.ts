import { db } from "../db/db"
import { sync } from "../sync"
import { stamp } from "../sync/hlc"
import { touchColumn } from "../sync/touch"

/**
 * Marks the column whose cards count as finished. At most one per board — "move
 * this card to done" needs a single answer — so marking one clears the rest.
 */
export async function setColumnDone(id: string, done: boolean): Promise<void> {
  const columns = await db.getColumns()
  const column = columns.find((c) => c.id === id)
  if (!column) return

  const now = stamp()
  await db.setColumn(touchColumn({ ...column, done }, ["done"], now))
  sync.markDirty("columns", id)

  if (!done) return

  for (const other of columns) {
    if (other.id === id) continue
    if (other.dashboardId !== column.dashboardId || !other.done) continue
    await db.setColumn(touchColumn({ ...other, done: false }, ["done"], now))
    sync.markDirty("columns", other.id)
  }
}
