import type { EditorView } from "@codemirror/view"
import { useEffect } from "react"

/**
 * Pushes a controlled `value` into the view whenever it changes outside it.
 */
export function useSyncedValue(view: EditorView | null, value: string) {
  const inSync = view !== null && view.state.doc.toString() === value
  useEffect(() => {
    if (!view || inSync) return
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: value },
    })
  }, [view, value, inSync])
}
