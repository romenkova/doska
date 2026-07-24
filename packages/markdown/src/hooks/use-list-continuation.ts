import { useCallback, useEffect, useLayoutEffect, useRef } from "react"

interface Options {
  value: string
  onChangeValue: (value: string) => void
  enabled?: boolean
}

// `- foo`, `* foo`, `+ foo`, optionally with a `[ ]`/`[x]` task checkbox.
const UNORDERED = /^(\s*)([-*+])[ \t]+(\[[ xX]\][ \t]+)?(.*)$/
// `1. foo` or `1) foo`.
const ORDERED = /^(\s*)(\d+)([.)])[ \t]+(.*)$/

interface ListItem {
  /** Prefix to prepend to the next row (indent + marker + space). */
  continuation: string
  /** True when the item has no text after its marker. */
  empty: boolean
}

function parseListItem(line: string): ListItem | null {
  const unordered = UNORDERED.exec(line)
  if (unordered) {
    const [, indent, bullet, checkbox, content] = unordered
    // A continued task item starts unchecked, matching editor conventions.
    const marker = checkbox ? `${bullet} [ ] ` : `${bullet} `
    return { continuation: indent + marker, empty: content.trim() === "" }
  }

  const ordered = ORDERED.exec(line)
  if (ordered) {
    const [, indent, num, delim, content] = ordered
    const next = Number(num) + 1
    return { continuation: `${indent}${next}${delim} `, empty: content.trim() === "" }
  }

  return null
}

/**
 * Continues Markdown lists when Enter is pressed inside a list item: inserts a
 * new row carrying the same marker (bullet, or the next number for ordered
 * lists). Pressing Enter on an empty item strips the marker instead, so you can
 * exit the list. With a selection, or on a non-list line, the browser's native
 * newline is left untouched.
 */
export function useListContinuation(
  ref: React.RefObject<HTMLTextAreaElement | null>,
  { value, onChangeValue, enabled = true }: Options
) {
  const pendingCaret = useRef<number | null>(null)

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.shiftKey || e.metaKey || e.ctrlKey || e.altKey)
        return
      const textarea = ref.current
      if (!textarea || textarea.selectionStart !== textarea.selectionEnd) return

      const caret = textarea.selectionStart
      const text = textarea.value
      const lineStart = text.lastIndexOf("\n", caret - 1) + 1
      const lineEnd = text.indexOf("\n", caret)
      const line = text.slice(lineStart, lineEnd === -1 ? text.length : lineEnd)

      const item = parseListItem(line)
      if (!item) return

      e.preventDefault()

      if (item.empty) {
        // Drop the marker, leaving a blank line to type prose on.
        onChangeValue(text.slice(0, lineStart) + text.slice(caret))
        pendingCaret.current = lineStart
        return
      }

      const insert = "\n" + item.continuation
      onChangeValue(text.slice(0, caret) + insert + text.slice(caret))
      pendingCaret.current = caret + insert.length
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
