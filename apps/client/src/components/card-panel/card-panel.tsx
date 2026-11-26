import { useIsMobile } from "@doska/ui-kit"
import { useCallback, useEffect, useState } from "react"
import { useLocation, useRoute } from "wouter"
import { useHistoryState } from "wouter/use-browser-location"
import { routes } from "@/lib/routes"
import { useDeck } from "@/providers/deck/deck-context"
import { useRevealCard } from "@/providers/card-reveal/card-reveal-context"
import { useCardDeleteToast } from "@/components/toasts/card-delete/use-card-delete-toast"
import { ArchivePane } from "./archive-pane"
import { CardPane } from "./card-pane"
import { CardPanelShell } from "./card-panel-shell"
import {
  useCardSave,
  useDeleteCard,
  useDiscardBlankCard,
  useCard,
} from "@doska/core"
import { isDesktop } from "@/lib/platform"
import { getCardView } from "@/lib/card-view"
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
  const [isArchiveRoute] = useRoute(routes.archived())
  const isNew = useHistoryState<{ new?: boolean } | null>()?.new === true

  // Outlives the route change, so the card stays on screen while the panel sweeps shut.
  const [lastCard, setLastCard] = useState(routeId)
  if (routeId && routeId !== lastCard) setLastCard(routeId)
  const [lastArchive, setLastArchive] = useState(isArchiveRoute)
  if (isArchiveRoute && !lastArchive) setLastArchive(true)
  if (routeId && lastArchive) setLastArchive(false)

  const { queue, flush } = useCardSave()
  const { id: deckId } = useDeck()
  const { mutate: deleteCard } = useDeleteCard(deckId)
  const { mutate: discardBlankCard } = useDiscardBlankCard(deckId)
  const reveal = useRevealCard()
  const { showCardDeleteToast } = useCardDeleteToast()

  const isMobile = useIsMobile()
  const showArchive = isArchiveRoute || (!routeId && !isMobile && lastArchive)
  const card = showArchive ? null : (routeId ?? (isMobile ? null : lastCard))
  const isOpen = routeId != null || isArchiveRoute
  const { data: content } = useCard(card)

  const close = useCallback(() => {
    void flush()
    navigate(closeHref)
  }, [flush, navigate, closeHref])

  // A card just added and closed untouched was never wanted. Checked after the
  // flush, so an edit still in the queue keeps it.
  const dismiss = () => {
    const saved = flush()
    if (isNew && routeId) {
      const id = routeId
      void saved.then(() => discardBlankCard(id))
    }
    navigate(closeHref)
  }

  useEffect(() => {
    if (isOpen && content?.deletedAt) close()
  }, [isOpen, content?.deletedAt, close])

  const revealOnBoard = (id: string) => {
    if (isMobile || getCardView() === "modal") close()
    reveal(id)
  }

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
      onClose={dismiss}
      onClosed={() => {
        setLastCard(null)
        setLastArchive(false)
      }}
      onTearOff={showArchive ? undefined : popOut}
      narrow={showArchive}
    >
      {showArchive && (
        <ArchivePane deckId={deckId} onClose={close} onReveal={revealOnBoard} />
      )}
      {card && content && (
        <CardPane
          key={card}
          cardId={card}
          content={content}
          isNew={isNew}
          onQueue={queue}
          onFlush={flush}
          onClose={dismiss}
          onDelete={() => {
            deleteCard(card, {
              onSuccess: () =>
                showCardDeleteToast(card, {
                  reopenPanel: true,
                  title: content.title.trim() || "Untitled card",
                }),
            })
          }}
          onReveal={() => revealOnBoard(card)}
          onPopOut={popOut && (() => popOut())}
        />
      )}
    </CardPanelShell>
  )
}
