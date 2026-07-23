import { flushSync } from "react-dom"
import { notifyManager } from "@tanstack/react-query"

/**
 * Runs a cache update with React Query's re-render notification flushed
 * synchronously, then restores the default (deferred, macrotask) scheduler.
 *
 * RQ normally defers notifications to a `setTimeout(0)`, which lands an optimistic
 * update a frame late — @hello-pangea/dnd needs the reordered board committed
 * before the drop event returns, or the card snaps back to its old column for a
 * frame. Rather than make every query in the app notify synchronously, we opt in
 * only for this one update.
 */
export function flushSyncUpdate(update: () => void) {
  notifyManager.setScheduler((cb) => flushSync(cb))
  try {
    update()
  } finally {
    notifyManager.setScheduler((cb) => setTimeout(cb, 0))
  }
}
