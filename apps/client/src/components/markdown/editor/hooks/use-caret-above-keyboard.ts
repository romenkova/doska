import { EditorView } from "@codemirror/view"
import { useEffect } from "react"

const KEYBOARD_MARGIN = 72

/** The keyboard opening shrinks the visual viewport; keeps the caret above it. */
export function useCaretAboveKeyboard(view: EditorView | null) {
  useEffect(() => {
    if (!view) return
    const onResize = () => {
      if (view.hasFocus)
        view.dispatch({
          effects: EditorView.scrollIntoView(view.state.selection.main.head, {
            yMargin: KEYBOARD_MARGIN,
          }),
        })
    }
    window.visualViewport?.addEventListener("resize", onResize)
    return () => window.visualViewport?.removeEventListener("resize", onResize)
  }, [view])
}
