import { db } from "../db/db"
import { sync } from "../sync"
import { stamp } from "../sync/hlc"

/** Sets a column's palette color (`""` clears it). */
export async function setColumnColor(id: string, color: string): Promise<void> {
  const column = (await db.getColumns()).find((c) => c.id === id)
  if (!column) return
  await db.setColumn({ ...column, color, updatedAt: stamp() })
  sync.markDirty("columns", id)
}
