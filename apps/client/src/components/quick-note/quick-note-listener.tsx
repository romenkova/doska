import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { keys } from "@doska/core/keys"
import { isDesktop } from "@/lib/platform"
import { CHANGED_EVENT } from "./quick-note-event"

/**
 * The popup writes straight to the shared IndexedDB, which this window's query
 * cache can't see, so the popup announces each change and the cache is refreshed.
 */
export function QuickNoteListener() {
  const qc = useQueryClient()

  useEffect(() => {
    if (!isDesktop()) return

    let cancelled = false
    let unlisten: (() => void) | undefined

    void import("@tauri-apps/api/event").then(async ({ listen }) => {
      const stop = await listen(CHANGED_EVENT, () => {
        qc.invalidateQueries({ queryKey: keys.boards })
        qc.invalidateQueries({ queryKey: keys.cards })
        qc.invalidateQueries({ queryKey: keys.cardCols })
        qc.invalidateQueries({ queryKey: keys.digest })
      })
      if (cancelled) stop()
      else unlisten = stop
    })

    return () => {
      cancelled = true
      unlisten?.()
    }
  }, [qc])

  return null
}
