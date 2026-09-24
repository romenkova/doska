import type { EditorView } from "@codemirror/view"

/** Replaces `from..to` with `text` and parks the caret `caretOffset` into it. */
export function insertAt(
  view: EditorView,
  from: number,
  to: number,
  text: string,
  caretOffset: number
) {
  view.dispatch({
    changes: { from, to, insert: text },
    selection: { anchor: from + caretOffset },
    userEvent: "input",
  })
}
