/**
 * Starts a periodic background sync.
 *
 * Two focus signals, because they catch different gestures:
 *  - `visibilitychange` fires on tab switches (the tab is hidden, then shown);
 *  - window `focus` fires when the *window* regains focus (alt-tabbing back from
 *    another app), where the tab stayed "visible" the whole time so
 *    `visibilitychange` never fires.
 * Listening to only the first means returning to the window from another app
 * doesn't reconcile until the next poll. `reconcile` is idempotent (the engine
 * guards overlapping runs), so the occasional double-fire is harmless.
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

  // Window focus only matters while visible; if it's hidden, `start` no-ops and
  // the next visibility change takes over.
  const onFocus = () => {
    if (document.visibilityState === "visible") {
      reconcile()
      start()
    }
  }

  // Coming back online: flush the queue now rather than making the user watch a
  // stale "offline" notice until the next tick.
  const onOnline = () => reconcile()

  document.addEventListener("visibilitychange", onVisibility)
  window.addEventListener("focus", onFocus)
  window.addEventListener("online", onOnline)
  if (document.visibilityState === "visible") {
    reconcile()
    start()
  }

  return () => {
    document.removeEventListener("visibilitychange", onVisibility)
    window.removeEventListener("focus", onFocus)
    window.removeEventListener("online", onOnline)
    stop()
  }
}
