import { useCallback, useEffect, useRef } from "react"
import { runtime } from "../../runtime"
import { useSaveCard, type CardPatch } from "./card"

/** The card edited most recently, in any window; the desktop popup continues it. */
export const LAST_CARD_KEY = "doska:last-card"

/** Long enough to coalesce a burst of typing, short enough to read as live. */
const SAVE_DELAY = 500

/**
 * Debounced write-through for card edits, so the board card updates as you type.
 * The id travels with the patch: a queued write has to land on the card it was
 * typed into, even if the panel has since moved on to another one.
 */
export function useCardSave() {
  const { mutateAsync } = useSaveCard()
  const pending = useRef<{ id: string; patch: CardPatch } | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  /** Resolves once the queued write has landed, failed or not. */
  const flush = useCallback(async () => {
    clearTimeout(timer.current)
    const queued = pending.current
    pending.current = null
    if (!queued) return
    try {
      await mutateAsync(queued)
    } catch {
      // As with mutate(), the failure is the mutation's to report.
    }
  }, [mutateAsync])

  const queue = useCallback(
    (id: string, patch: CardPatch) => {
      // Edits for a card we've navigated away from go out on their own.
      if (pending.current && pending.current.id !== id) void flush()
      runtime().kv.set(LAST_CARD_KEY, id)
      pending.current = { id, patch: { ...pending.current?.patch, ...patch } }
      clearTimeout(timer.current)
      timer.current = setTimeout(flush, SAVE_DELAY)
    },
    [flush]
  )

  useEffect(() => () => void flush(), [flush])

  return { queue, flush }
}
