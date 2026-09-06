import { useEffect, type RefObject } from "react"

export function useEndBodyFocus(
  textareaRef: RefObject<HTMLTextAreaElement | null>,
  enabled: boolean | undefined
) {
  useEffect(() => {
    const el = textareaRef.current
    if (!enabled || !el) return
    el.setSelectionRange(el.value.length, el.value.length)
  }, [textareaRef, enabled])
}
