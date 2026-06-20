/** localStorage key under which the pending dirty refs are persisted. */
export const DIRTY_KEY = "deck:sync:dirty"

/** meta-store key prefix for the per-board pull cursor (server seq). */
export const CURSOR_PREFIX = "cursor:"

export const DEFAULT_SYNC_INTERVAL = 5_000
/**
 * The poll interval, overridable at build time via `VITE_SYNC_INTERVAL_MS` so
 * the e2e bundle can tick fast (sub-second) and observe a remote change without
 * waiting out the production cadence. Anything unset or invalid falls back
 * to the default.
 */
export function syncInterval(): number {
  const ms = Number(import.meta.env.VITE_SYNC_INTERVAL_MS)
  return Number.isFinite(ms) && ms > 0 ? ms : DEFAULT_SYNC_INTERVAL
}
