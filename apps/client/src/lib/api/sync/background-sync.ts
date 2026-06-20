import { startBackgroundSync as start } from "@deck/sync"
import { sync } from "./sync-engine"

const DEFAULT_SYNC_INTERVAL = 5_000

/**
 * The poll interval, overridable at build time via `VITE_SYNC_INTERVAL_MS` so
 * the e2e bundle can tick fast (sub-second) and observe a remote change without
 * waiting out the production cadence. Anything unset or invalid falls back
 * to the default.
 */
const SYNC_INTERVAL = (() => {
  const ms = Number(import.meta.env.VITE_SYNC_INTERVAL_MS)
  return Number.isFinite(ms) && ms > 0 ? ms : DEFAULT_SYNC_INTERVAL
})()

/**
 * Starts the periodic background sync at the deck cadence. Returns a stop
 * function that clears the timer and listener.
 */
export function startBackgroundSync(): () => void {
  return start(() => void sync.reconcile(), SYNC_INTERVAL)
}
