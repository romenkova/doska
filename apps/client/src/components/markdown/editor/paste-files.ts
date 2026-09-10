import type { Extension } from "@codemirror/state"
import { EditorView } from "@codemirror/view"

export function pasteFiles(
  onPasteFiles: (files: File[]) => Promise<string | null>
): Extension {
  return EditorView.domEventHandlers({
    paste(event, view) {
      const files = Array.from(event.clipboardData?.files ?? [])
      if (files.length === 0) return false
      event.preventDefault()
      const { from, to } = view.state.selection.main
      void onPasteFiles(files).then((snippet) => {
        if (!snippet) return
        view.dispatch({
          changes: { from, to, insert: snippet },
          selection: { anchor: from + snippet.length },
          userEvent: "input",
        })
      })
      return true
    },
  })
}
