import {
  type ChangeSpec,
  EditorSelection,
  type StateCommand,
} from "@codemirror/state"
import { keymap } from "@codemirror/view"
import { toggleTaskLine } from "@doska/markdown"

/** Wraps each selection in `marker`, or unwraps it if already wrapped. */
function toggleMark(marker: string): StateCommand {
  const n = marker.length

  return ({ state, dispatch }) => {
    const isMarker = (pos: number) => state.sliceDoc(pos, pos + n) === marker
    const isRunEnd = (pos: number) => state.sliceDoc(pos, pos + 1) !== marker[0]

    const unwrap = (open: number, close: number) => ({
      changes: [
        { from: open, to: open + n },
        { from: close, to: close + n },
      ],
      range: EditorSelection.range(open, close - n),
    })

    const tr = state.changeByRange(({ from, to }) => {
      const wrappedOutside =
        from >= n &&
        isMarker(from - n) &&
        isMarker(to) &&
        isRunEnd(from - n - 1) &&
        isRunEnd(to + n)
      if (wrappedOutside) return unwrap(from - n, to)

      const wrappedInside =
        to - from >= 2 * n &&
        isMarker(from) &&
        isMarker(to - n) &&
        isRunEnd(from + n) &&
        isRunEnd(to - n - 1)
      if (wrappedInside) return unwrap(from, to - n)

      return {
        changes: [
          { from, insert: marker },
          { from: to, insert: marker },
        ],
        range: EditorSelection.range(from + n, to + n),
      }
    })

    dispatch(state.update(tr, { scrollIntoView: true, userEvent: "input" }))
    return true
  }
}

/** Ticks or unticks each selected task line; turns other lines into tasks. */
const toggleTask: StateCommand = ({ state, dispatch }) => {
  const changes: ChangeSpec[] = []
  const seen = new Set<number>()

  for (const { from, to } of state.selection.ranges) {
    const last = state.doc.lineAt(to).number
    for (let n = state.doc.lineAt(from).number; n <= last; n++) {
      if (seen.has(n)) continue
      seen.add(n)

      const line = state.doc.line(n)
      const edit = toggleTaskLine(line.text)
      changes.push({
        from: line.from + edit.from,
        to: line.from + edit.to,
        insert: edit.insert,
      })
    }
  }

  const changeSet = state.changes(changes)

  dispatch(
    state.update({
      changes: changeSet,
      selection: state.selection.map(changeSet, 1),
      scrollIntoView: true,
      userEvent: "input",
    })
  )
  return true
}

// stopPropagation: ⌘B also toggles the sidebar from a window listener.
export const formatKeymap = keymap.of(
  [
    { key: "Mod-b", run: toggleMark("**") },
    { key: "Mod-i", run: toggleMark("*") },
    { key: "Mod-e", run: toggleMark("`") },
    { key: "Mod-Enter", run: toggleTask },
  ].map((binding) => ({ ...binding, stopPropagation: true }))
)
