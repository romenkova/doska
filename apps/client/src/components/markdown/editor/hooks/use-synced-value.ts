import type { EditorView } from "@codemirror/view"
import { useEffect } from "react"

/** Pushes a controlled `value` into the view whenever it changes outside it. */
export function useSyncedValue(view: EditorView | null, value: string) {
  useEffect(() => {
    if (!view) return
    const current = view.state.doc.toString()
    if (current === value) return
    view.dispatch({ changes: { from: 0, to: current.length, insert: value } })
  }, [view, value])
}
