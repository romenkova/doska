import { db } from "../db/db"
import { sync } from "../sync"
import { stamp } from "../sync/hlc"

/** A user-entered prefix reduced to card-id form: uppercase alnum, 1–6 chars. */
export function normalizePrefix(input: string): string {
  return input
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6)
}

/** True when another live board already uses `prefix` (case-insensitive). */
export async function prefixTaken(
  prefix: string,
  exceptId: string
): Promise<boolean> {
  const list = await db.getDashboards()
  const upper = prefix.toUpperCase()
  return list.some(
    (d) =>
      d.id !== exceptId &&
      d.deletedAt === null &&
      (d.prefix ?? "").toUpperCase() === upper
  )
}

/**
 * Sets a board's card-id prefix (the `ROAD` in `ROAD-12`). Rejects a prefix
 * already used by another live board — a shared prefix makes `PREFIX-N`
 * ambiguous. Cards store only their number, so this relabels every card with no
 * data migration. Throws `"PREFIX_EMPTY"` / `"PREFIX_TAKEN"` for the caller to
 * surface inline.
 */
export async function setDashboardPrefix(
  id: string,
  input: string
): Promise<void> {
  const prefix = normalizePrefix(input)
  if (!prefix) throw new Error("PREFIX_EMPTY")
  if (await prefixTaken(prefix, id)) throw new Error("PREFIX_TAKEN")

  const dashboard = (await db.getDashboards()).find((d) => d.id === id)
  if (!dashboard || dashboard.prefix === prefix) return
  await db.setDashboard({ ...dashboard, prefix, updatedAt: stamp() })
  sync.markDirty("dashboards", id)
}
