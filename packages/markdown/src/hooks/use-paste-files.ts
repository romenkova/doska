import { useLayoutEffect, useRef } from "react"

interface Options {
  value: string
  onChangeValue: (value: string) => void
  /** Persists pasted files and returns Markdown to splice at the caret, or null. */
  onPasteFiles?: (files: File[]) => Promise<string | null>
}

/**
 * Returns an `onPaste` handler that uploads pasted files via `onPasteFiles` and
 * splices any returned Markdown at the caret, restoring the caret once the async
 * upload updates the controlled value.
 */
export function usePasteFiles(
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

  return (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (!onPasteFiles) return
    const files = Array.from(e.clipboardData.files)
    if (files.length === 0) return // plain text: let the default paste run
    e.preventDefault()
    const start = e.currentTarget.selectionStart
    const end = e.currentTarget.selectionEnd
    void onPasteFiles(files).then((snippet) => {
      if (!snippet) return
      const current = ref.current?.value ?? value
      const next = current.slice(0, start) + snippet + current.slice(end)
      pendingCaret.current = start + snippet.length
      onChangeValue(next)
    })
  }
}
