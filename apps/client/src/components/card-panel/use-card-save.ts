import { useCallback, useEffect, useRef } from "react"
import { useSaveCard, type CardPatch } from "@/lib/data/mutations"

/** Long enough to coalesce a burst of typing, short enough to read as live. */
const SAVE_DELAY = 200

/**
 * Debounced write-through for card edits, so the board card updates as you type.
 * The id travels with the patch: a queued write has to land on the card it was
 * typed into, even if the panel has since moved on to another one.
 */
export function useCardSave() {
  const { mutate } = useSaveCard()
  const pending = useRef<{ id: string; patch: CardPatch } | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const flush = useCallback(() => {
    clearTimeout(timer.current)
    const queued = pending.current
    pending.current = null
    if (queued) mutate(queued)
  }, [mutate])

  const queue = useCallback(
    (id: string, patch: CardPatch) => {
      // Edits for a card we've navigated away from go out on their own.
      if (pending.current && pending.current.id !== id) flush()
      pending.current = { id, patch: { ...pending.current?.patch, ...patch } }
      clearTimeout(timer.current)
      timer.current = setTimeout(flush, SAVE_DELAY)
    },
    [flush]
  )

  useEffect(() => () => flush(), [flush])

  return { queue, flush }
}
