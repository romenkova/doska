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
 * Starts the periodic background sync. Reconciles every `SYNC_INTERVAL` while the
 * tab is visible, and once immediately whenever it becomes visible (covering the
 * stale-tab case). Returns a stop function that clears the timer and listener.
 */
export function startBackgroundSync(): () => void {
  let id: ReturnType<typeof setInterval> | undefined

  const start = () => {
    if (id === undefined)
      id = setInterval(() => void sync.reconcile(), SYNC_INTERVAL)
  }

  const stop = () => {
    if (id !== undefined) {
      clearInterval(id)
      id = undefined
    }
  }

  const onVisibility = () => {
    if (document.visibilityState === "visible") {
      void sync.reconcile()
      start()
    } else {
      stop()
    }
  }

  document.addEventListener("visibilitychange", onVisibility)
  if (document.visibilityState === "visible") start()

  return () => {
    document.removeEventListener("visibilitychange", onVisibility)
    stop()
  }
}
