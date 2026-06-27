import { useCallback, useEffect, useLayoutEffect, useRef } from "react"

interface Options {
  value: string
  onChangeValue: (value: string) => void
  enabled?: boolean
}

/** Computes the cut of the whole line the caret sits on, including its trailing
 * newline (or the leading one for the last line, so the line vanishes wholly). */
function cutLine(value: string, caret: number) {
  const lineStart = value.lastIndexOf("\n", caret - 1) + 1
  const newlineEnd = value.indexOf("\n", caret)
  // No trailing newline means we're on the last line: take the preceding
  // newline instead so removing the line doesn't leave a dangling blank one.
  const lineEnd = newlineEnd === -1 ? value.length : newlineEnd + 1
  const start = newlineEnd === -1 && lineStart > 0 ? lineStart - 1 : lineStart

  const column = caret - lineStart
  const next = value.slice(0, start) + value.slice(lineEnd)
  // Keep the caret column on whatever line shifted up into this spot.
  const nextLineEnd = next.indexOf("\n", start)
  const caretMax = nextLineEnd === -1 ? next.length : nextLineEnd
  const caretNext = Math.min(start + column, caretMax)

  // Clipboard gets the line with a trailing newline so a paste re-inserts it
  // as a full line, matching IDE behaviour.
  const lineText = value.slice(
    lineStart,
    newlineEnd === -1 ? value.length : newlineEnd + 1
  )
  const clipboard = lineText.endsWith("\n") ? lineText : lineText + "\n"

  return { next, caret: caretNext, clipboard }
}

/**
 * Adds IDE-style "cut line" to a textarea: pressing Cmd/Ctrl+X with no selection
 * cuts the entire current line to the clipboard. With a selection it does
 * nothing, letting the browser's native cut handle it.
 */
export function useCutLine(
  ref: React.RefObject<HTMLTextAreaElement | null>,
  { value, onChangeValue, enabled = true }: Options
) {
  const pendingCaret = useRef<number | null>(null)

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key !== "x" || !(e.metaKey || e.ctrlKey)) return
      const textarea = ref.current
      if (!textarea || textarea.selectionStart !== textarea.selectionEnd) return

      e.preventDefault()
      const { next, caret, clipboard } = cutLine(
        textarea.value,
        textarea.selectionStart
      )
      void navigator.clipboard?.writeText(clipboard)
      pendingCaret.current = caret
      onChangeValue(next)
    },
    [ref, onChangeValue]
  )

  useEffect(() => {
    const textarea = ref.current
    if (!textarea || !enabled) return
    textarea.addEventListener("keydown", onKeyDown)
    return () => textarea.removeEventListener("keydown", onKeyDown)
  }, [ref, enabled, onKeyDown])

  // Restore the caret once the controlled value update lands.
  useLayoutEffect(() => {
    if (pendingCaret.current === null) return
    const textarea = ref.current
    if (textarea) {
      textarea.focus()
      textarea.setSelectionRange(pendingCaret.current, pendingCaret.current)
    }
    pendingCaret.current = null
  }, [ref, value])
}
