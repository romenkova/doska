import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { CardRevealCtx } from "./card-reveal-context"
import { useRevealFromWindow } from "./use-reveal-from-window"

/** How long the highlight stays on: a flash, not a mode. */
const FLASH_MS = 1200

/**
 * The card panel opens right after a reveal, wait for it
 */
const PANEL_SETTLE_MS = 300

export function CardRevealProvider({ children }: { children: ReactNode }) {
  const [revealed, setRevealed] = useState<string | null>(null)
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      clearTimeout(flashTimer.current ?? undefined)
      clearTimeout(scrollTimer.current ?? undefined)
    },
    []
  )

  const reveal = useCallback((id: string) => {
    setRevealed(id)
    clearTimeout(flashTimer.current ?? undefined)
    flashTimer.current = setTimeout(() => setRevealed(null), FLASH_MS)

    clearTimeout(scrollTimer.current ?? undefined)
    scrollTimer.current = setTimeout(() => {
      document
        .querySelector(`[data-rfd-draggable-id="${id}"]`)
        ?.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        })
    }, PANEL_SETTLE_MS)
  }, [])

  useRevealFromWindow(reveal)

  // Memoised: board cards read it, and they are memoised on their props.
  const value = useMemo(() => ({ revealed, reveal }), [revealed, reveal])

  return (
    <CardRevealCtx.Provider value={value}>{children}</CardRevealCtx.Provider>
  )
}
