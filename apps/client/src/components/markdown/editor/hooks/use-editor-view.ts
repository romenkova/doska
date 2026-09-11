import { Compartment, EditorState } from "@codemirror/state"
import { EditorView } from "@codemirror/view"
import { useRef, useState } from "react"
import { editorExtensions, type EditorOptions } from "../extensions"
import { useLatest } from "./use-latest"
import { useMountedView } from "./use-mounted-view"
import { useSyncedValue } from "./use-synced-value"
import { useWikilinkTargets } from "./use-wikilink-targets"

/**
 * Mounts a CodeMirror view into `containerRef`
 */
export function useEditorView(options: EditorOptions) {
  const containerRef = useRef<HTMLDivElement>(null)
  const live = useLatest(options)
  const [targets] = useState(() => new Compartment())

  const view = useMountedView(containerRef, (parent) => {
    const view = new EditorView({
      parent,
      state: EditorState.create({
        doc: options.value,
        extensions: editorExtensions(live, targets),
      }),
    })
    if (options.autoFocus) {
      view.dispatch({ selection: { anchor: view.state.doc.length } })
      view.focus()
    }
    return view
  })

  useSyncedValue(view, options.value)
  useWikilinkTargets(
    view,
    targets,
    options.markdown ? options.wikilinks : undefined
  )

  return { containerRef, view }
}
