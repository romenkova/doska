import { useLayoutEffect, useRef } from "react"
import { replaceRange } from "../edit-text"

interface Options {
  value: string
  onChangeValue: (value: string) => void
  /** Persists pasted files and returns Markdown to splice at the caret, or null. */
  onPasteFiles?: (files: File[]) => Promise<string | null>
}

/** A pasted URL over a single-line selection: `[selection](url)`, or null. */
export function linkFromPaste(
  selection: string,
  clipboard: string
): string | null {
  const URL_RE = /^https?:\/\/\S+$/i
  const url = clipboard.trim()
  if (!selection || selection.includes("\n") || !URL_RE.test(url)) return null
  return `[${selection}](${url})`
}

/**
 * Returns an `onPaste` handler.
 * A URL pasted over selected text wraps the
 * selection into a Markdown link.
 * Pasted files are uploaded via `onPasteFiles`.
 */
export function usePaste(
  ref: React.RefObject<HTMLTextAreaElement | null>,
  { value, onChangeValue, onPasteFiles }: Options
) {
  const pendingCaret = useRef<number | null>(null)

  useLayoutEffect(() => {
    if (pendingCaret.current === null) return
    const textarea = ref.current
    if (textarea) {
      textarea.focus()
      const caret = pendingCaret.current
      textarea.setSelectionRange(caret, caret)
    }
    pendingCaret.current = null
  }, [ref, value])

  function splice(start: number, end: number, snippet: string) {
    const textarea = ref.current
    pendingCaret.current = start + snippet.length
    if (textarea && replaceRange(textarea, start, end, snippet)) return
    const current = textarea?.value ?? value
    onChangeValue(current.slice(0, start) + snippet + current.slice(end))
  }

  return (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const start = e.currentTarget.selectionStart
    const end = e.currentTarget.selectionEnd

    const link = linkFromPaste(
      e.currentTarget.value.slice(start, end),
      e.clipboardData.getData("text/plain")
    )
    if (link) {
      e.preventDefault()
      splice(start, end, link)
      return
    }

    if (!onPasteFiles) return
    const files = Array.from(e.clipboardData.files)

    if (files.length === 0) return // plain text: let the default paste run
    e.preventDefault()
    void onPasteFiles(files).then((snippet) => {
      if (snippet) splice(start, end, snippet)
    })
  }
}
