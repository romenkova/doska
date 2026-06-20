import { syncInterval } from "./constants"
import { reconcile } from "./sync"

/**
 * Starts the periodic background sync. Reconciles every `SYNC_INTERVAL` while the
 * tab is visible, and once immediately whenever it becomes visible (covering the
 * stale-tab case). Returns a stop function that clears the timer and listener.
 */
export function startBackgroundSync(): () => void {
  let id: ReturnType<typeof setInterval> | undefined

  const start = () => {
    if (id === undefined)
      id = setInterval(() => void reconcile(), syncInterval())
  }

  const stop = () => {
    if (id !== undefined) {
      clearInterval(id)
      id = undefined
    }
  }

  const onVisibility = () => {
    if (document.visibilityState === "visible") {
      void reconcile()
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
