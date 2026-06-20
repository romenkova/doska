import { useEffect } from "react"
import { sync } from "@/lib/api/sync"

/**
 * Maps ⌘S / Ctrl+S to an immediate reconcile. Mutations already persist locally
 * and sync in the background, so this is a "flush now" affordance for the
 * save-by-habit reflex — and it suppresses the browser's Save Page dialog.
 */
export function useSyncShortcut() {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault()
        void sync.reconcile()
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])
}
