/**
 * Starts a periodic background sync. Calls `reconcile` every `intervalMs` while
 * the tab is visible, and once immediately whenever the app regains focus —
 * covering the stale-tab case. Returns a stop function that clears the timer and
 * listeners.
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

  document.addEventListener("visibilitychange", onVisibility)
  window.addEventListener("focus", onFocus)
  if (document.visibilityState === "visible") start()

  return () => {
    document.removeEventListener("visibilitychange", onVisibility)
    window.removeEventListener("focus", onFocus)
    stop()
  }
}
