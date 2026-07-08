import { idb, META_STORE } from "../../db/idb"
import { CARDS, COLUMNS, DASHBOARDS } from "../../constants"
import { MD_EXT } from "./mapping"

/**
 * The `id → relative file path` map that ties stable record ids to their
 * title-derived files on disk. Kept as a single JSON blob in the `meta` store
 * (the `ClientDB` interface has no key enumeration, and the map is small).
 *
 * Two jobs:
 *  - **Renames/moves**: writing a record whose title changed moves its old path
 *    to the new one, instead of leaving an orphan.
 *  - **External deletions**: an id we tracked whose file is gone on the next scan
 *    means the user deleted it in Finder — the driver tombstones it locally.
 *
 * Paths are POSIX-style, relative to the sync root (e.g.
 * `Board/Column/Card.md`), so they're portable and comparable across scans.
 */

const INDEX_KEY = "fs:path-index"

export type PathMap = Record<string, string>

export async function loadPathIndex(): Promise<PathMap> {
  try {
    const raw = await idb.get<PathMap>(META_STORE, INDEX_KEY)
    return raw && typeof raw === "object" ? raw : {}
  } catch {
    return {}
  }
}

export async function savePathIndex(map: PathMap): Promise<void> {
  try {
    await idb.set(META_STORE, INDEX_KEY, map)
  } catch {
    // Storage unavailable; the next scan rebuilds paths from frontmatter ids.
  }
}

export function splitRel(rel: string): { parent: string; base: string } {
  const slash = rel.lastIndexOf("/")
  return slash === -1
    ? { parent: "", base: rel }
    : { parent: rel.slice(0, slash), base: rel.slice(slash + 1) }
}

/** Rewrites every entry at or under `oldPrefix` to sit under `newPrefix`. */
export function reprefix(map: PathMap, oldPrefix: string, newPrefix: string): void {
  if (oldPrefix === newPrefix) return
  for (const [id, rel] of Object.entries(map)) {
    if (rel === oldPrefix) map[id] = newPrefix
    else if (rel.startsWith(oldPrefix + "/"))
      map[id] = newPrefix + rel.slice(oldPrefix.length)
  }
}

/** Drops every entry at or under `prefix` (a deleted folder, or a single file). */
export function dropSubtree(map: PathMap, prefix: string): void {
  for (const [id, rel] of Object.entries(map)) {
    if (rel === prefix || rel.startsWith(prefix + "/")) delete map[id]
  }
}

/** Infers the store a rel path belongs to: `.md` file → card, else folder. */
export function storeOf(
  rel: string
): typeof CARDS | typeof COLUMNS | typeof DASHBOARDS {
  if (rel.endsWith(MD_EXT)) return CARDS
  return rel.includes("/") ? COLUMNS : DASHBOARDS
}
