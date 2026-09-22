import type { EditorView } from "@codemirror/view"
import { useEffect, useState, type RefObject } from "react"
import { useLatest } from "./use-latest"

/**
 * Creates a view inside `containerRef` on mount and destroys it on unmount.
 */
export function useMountedView(
  containerRef: RefObject<HTMLElement | null>,
  create: (parent: HTMLElement) => EditorView
) {
  const [view, setView] = useState<EditorView | null>(null)
  const createRef = useLatest(create)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const view = createRef.current(container)
    setView(view)
    return () => {
      view.destroy()
      setView(null)
    }
  }, [containerRef, createRef])

  return view
}
