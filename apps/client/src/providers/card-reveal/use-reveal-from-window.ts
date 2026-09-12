import { useEffect } from "react"
import { useLocation } from "wouter"
import { isDesktop } from "@/lib/platform"
import { routes } from "@/lib/routes"
import {
  REVEAL_EVENT,
  type RevealPayload,
} from "@/components/card-window/card-window-event"

/** A popout window asking to reveal its card here, on the board. */
export function useRevealFromWindow(reveal: (id: string) => void) {
  const [, navigate] = useLocation()

  useEffect(() => {
    if (!isDesktop()) return
    let cancelled = false
    let unlisten: (() => void) | undefined
    void Promise.all([
      import("@tauri-apps/api/event"),
      import("@tauri-apps/api/window"),
    ]).then(async ([{ listen }, { getCurrentWindow }]) => {
      const win = getCurrentWindow()
      const stop = await listen<RevealPayload>(REVEAL_EVENT, ({ payload }) => {
        navigate(`~${routes.deck.to(payload.deckId)}`)
        reveal(payload.cardId)
        void win.show().then(() => win.setFocus())
      })
      if (cancelled) stop()
      else unlisten = stop
    })
    return () => {
      cancelled = true
      unlisten?.()
    }
  }, [navigate, reveal])
}
