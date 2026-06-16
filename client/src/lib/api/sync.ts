import type { StoreName } from "./idb"

/**
 * Background sync between the local IndexedDB store and the server.
 *
 * The app is local-first: mutations land in IndexedDB instantly, and this job
 * flushes them to the backend on an interval instead of round-tripping on every
 * action. Changes are tracked per record (`store/key`) so a real sync can push
 * just what changed. There's no backend yet, so `syncToServer` logs the pending
 * records instead of POSTing them.
 */

const SYNC_INTERVAL = 30_000

/** Records changed locally but not yet pushed, as `store/key` refs. */
const dirty = new Set<string>()

/** Flags a record as changed locally and awaiting sync. */
export function markDirty(store: StoreName, key: string) {
  dirty.add(`${store}/${key}`)
}

/** Pushes pending local changes to the server. Stubbed: logs instead of POSTing. */
export async function syncToServer(): Promise<void> {
  if (dirty.size === 0) return
  const pushing = [...dirty]
  dirty.clear()

  // TODO: replace with a real call that sends the changed records, e.g.
  //   await fetch("/sync", { method: "POST", body: JSON.stringify(pushing) })
  // On failure, re-add `pushing` to `dirty` so the next tick retries.
  console.info(`[sync] would push ${pushing.length} change(s) to server`, pushing)
}

/** Starts the periodic background sync. Returns a stop function. */
export function startBackgroundSync(): () => void {
  const id = setInterval(() => void syncToServer(), SYNC_INTERVAL)
  return () => clearInterval(id)
}
