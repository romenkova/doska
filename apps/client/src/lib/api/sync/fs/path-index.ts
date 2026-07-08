import { idb, META_STORE } from "../../db/idb"

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
