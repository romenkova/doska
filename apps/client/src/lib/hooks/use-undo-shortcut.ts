import { useEffect } from "react"
import { useRestore, popUndo } from "@doska/core"

/** Text fields own their own undo history; ⌘Z there must not reach the board. */
function isEditing(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return (
    target.isContentEditable ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement
  )
}

/**
 * Maps ⌘Z / Ctrl+Z to taking back the last deletion of this session. Only
 * deletions: everything else the app writes is either trivially redone or lives
 * in a text field with its own undo.
 */
export function useUndoShortcut() {
  const { mutate: restore } = useRestore()

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey) || e.shiftKey) return
      if (e.key.toLowerCase() !== "z") return
      if (isEditing(e.target)) return

      const entry = popUndo()
      if (!entry) return
      e.preventDefault()
      restore(entry)
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [restore])
}
