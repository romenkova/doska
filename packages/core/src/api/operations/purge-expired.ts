import { RETENTION_MS } from "@doska/contract"
import { CARDS, COLUMNS, DASHBOARDS, type StoreName } from "../constants"
import { db } from "../db/db"
import { sync } from "../sync"

/**
 * Hard-deletes tombstones past their retention window — the trash emptying
 * itself. Runs at startup and whenever the trash is opened; the server does the
 * same sweep on its own schedule, so neither end has to announce the removal.
 *
 * A tombstone still waiting to push is left alone whatever its age: dropping it
 * would lose the deletion for every other client.
 */
export async function purgeExpired(now = Date.now()): Promise<number> {
  const cutoff = now - RETENTION_MS

  const expired: [StoreName, string][] = []
  const [dashboards, columns, cards] = await Promise.all([
    db.getDashboards(),
    db.getColumns(),
    db.getCards(),
  ])
  for (const d of dashboards)
    if (d.deletedAt !== null && d.deletedAt < cutoff)
      expired.push([DASHBOARDS, d.id])
  for (const c of columns)
    if (c.deletedAt !== null && c.deletedAt < cutoff)
      expired.push([COLUMNS, c.id])
  for (const c of cards)
    if (c.deletedAt !== null && c.deletedAt < cutoff)
      expired.push([CARDS, c.id])

  let purged = 0
  for (const [store, id] of expired) {
    if (sync.isDirty(store, id)) continue
    await db.hardDelete(store, id)
    purged += 1
  }
  return purged
}
