import { useIsMobile } from "@doska/ui-kit"
import { useCallback, useEffect, useState } from "react"
import { useLocation, useRoute } from "wouter"
import { routes } from "@/lib/routes"
import { useDeck } from "@/providers/deck/deck-context"
import { useRevealCard } from "@/providers/card-reveal/card-reveal-context"
import { useCardDeleteToast } from "@/components/toasts/card-delete/use-card-delete-toast"
import { CardPane } from "./card-pane"
import { CardPanelShell } from "./card-panel-shell"
import { useCardSave, useDeleteCard } from "@doska/core/mutations"
import { useCard } from "@doska/core/queries"
import { isDesktop } from "@/lib/platform"
import {
  openCardWindow,
  type DropPoint,
} from "@/components/card-window/open-card-window"

interface IProps {
  /** Where to navigate when the panel closes (its deck root). */
  closeHref: string
}

export function CardPanel({ closeHref }: IProps) {
  const [, navigate] = useLocation()
  const [, routeParams] = useRoute(routes.card.pattern)
  const routeId = routeParams?.id ?? null

  // Outlives the route change, so the card stays on screen while the panel sweeps shut.
  const [lastCard, setLastCard] = useState(routeId)
  if (routeId && routeId !== lastCard) setLastCard(routeId)

  const { queue, flush } = useCardSave()
  const { id: deckId } = useDeck()
  const { mutate: deleteCard } = useDeleteCard(deckId)
  const reveal = useRevealCard()
  const { showCardDeleteToast } = useCardDeleteToast()

  const isMobile = useIsMobile()
  const card = routeId ?? (isMobile ? null : lastCard)
  const isOpen = routeId != null
  const { data: content } = useCard(card)

  const close = useCallback(() => {
    flush()
    navigate(closeHref)
  }, [flush, navigate, closeHref])

  useEffect(() => {
    if (isOpen && content?.deletedAt) close()
  }, [isOpen, content?.deletedAt, close])

  const popOut = isDesktop()
    ? (at?: DropPoint) => {
        if (!card) return
        close()
        void openCardWindow(card, at)
      }
    : undefined

  return (
    <CardPanelShell
      isOpen={isOpen}
      onClose={close}
      onClosed={() => setLastCard(null)}
      onTearOff={popOut}
    >
      {card && content && (
        <CardPane
          key={card}
          cardId={card}
          content={content}
          onQueue={queue}
          onClose={close}
          onDelete={() => {
            deleteCard(card)
            showCardDeleteToast(card, {
              reopenPanel: true,
              title: content.title.trim() || "Untitled card",
            })
          }}
          onReveal={() => {
            if (isMobile) close()
            reveal(card)
          }}
          onPopOut={popOut && (() => popOut())}
        />
      )}
    </CardPanelShell>
  )
}
