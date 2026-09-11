import { MobileOverride } from "@doska/ui-kit"
import { useCallback, useEffect } from "react"
import { emitTo } from "@tauri-apps/api/event"
import { getCurrentWindow } from "@tauri-apps/api/window"
import { useCardSave, useDeleteCard } from "@doska/core/mutations"
import { useCard, useCardDeckId } from "@doska/core/queries"
import { CardPane } from "@/components/card-panel/card-pane"
import { DeckProvider } from "@/providers/deck/deck-context"
import { REVEAL_EVENT, type RevealPayload } from "./card-window-event"

interface IProps {
  cardId: string
}

/** One card in its own desktop window, torn off the panel. */
export function CardWindowPage({ cardId }: IProps) {
  const { data: content } = useCard(cardId)
  const { data: deckId } = useCardDeckId(cardId)
  const { queue, flush } = useCardSave()
  const { mutate: deleteCard } = useDeleteCard(deckId ?? "")

  const close = useCallback(() => {
    flush()
    void getCurrentWindow().close()
  }, [flush])

  useEffect(() => {
    if (content?.deletedAt) close()
  }, [content?.deletedAt, close])

  const title = content?.title.trim()
  useEffect(() => {
    void getCurrentWindow().setTitle(title || "Untitled card")
  }, [title])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [close])

  return (
    <div className="flex h-svh flex-col overflow-hidden bg-card pt-5 text-sm text-card-foreground">
      {/* The measure the card reads at; the window may be much wider. */}
      <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col">
        {content && deckId && (
          <DeckProvider value={{ id: deckId, sort: [] }}>
            <MobileOverride value={false}>
              <CardPane
                key={cardId}
                cardId={cardId}
                content={content}
                onQueue={queue}
                onClose={close}
                onDelete={() => {
                  deleteCard(cardId)
                  close()
                }}
                onReveal={() => {
                  const payload: RevealPayload = { cardId, deckId }
                  void emitTo("main", REVEAL_EVENT, payload)
                }}
                inWindow
              />
            </MobileOverride>
          </DeckProvider>
        )}
      </div>
    </div>
  )
}
