/**
 * Starts a periodic background sync. Calls `reconcile` every `intervalMs` while
 * the tab is visible, and once immediately whenever it becomes visible (covering
 * the stale-tab case). Returns a stop function that clears the timer and listener.
 */
export function startBackgroundSync(
  reconcile: () => void,
  intervalMs: number
): () => void {
  let id: ReturnType<typeof setInterval> | undefined

  const start = () => {
    if (id === undefined) id = setInterval(reconcile, intervalMs)
  }

  const stop = () => {
    if (id !== undefined) {
      clearInterval(id)
      id = undefined
    }
  }

  const onVisibility = () => {
    if (document.visibilityState === "visible") {
      reconcile()
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
