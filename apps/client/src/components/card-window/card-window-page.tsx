import { MobileOverride } from "@doska/ui-kit"
import { useCallback, useEffect } from "react"
import { getCurrentWindow } from "@tauri-apps/api/window"
import { useCardSave, useDeleteCard } from "@doska/core/mutations"
import { useCard, useCardDeckId } from "@doska/core/queries"
import { CardPane } from "@/components/card-panel/card-pane"
import { isDesktop } from "@/lib/platform"
import { DeckProvider } from "@/providers/deck/deck-context"
import { revealInMain } from "./card-window-event"

interface IProps {
  cardId: string
}

/** One card in its own desktop window, torn off the panel. */
export function CardWindowPage({ cardId }: IProps) {
  const { data: content } = useCard(cardId)
  const { data: deckId } = useCardDeckId(cardId)
  const { queue, flush } = useCardSave()
  const { mutate: deleteCard } = useDeleteCard(deckId ?? "")

  // Hidden, not closed: tearing down the webview races WebKit's display
  // link on macOS and segfaults. The window is reused on the next open.
  const close = useCallback(() => {
    flush()
    if (isDesktop()) void getCurrentWindow().hide()
  }, [flush])

  useEffect(() => {
    if (content?.deletedAt) close()
  }, [content?.deletedAt, close])

  const title = content?.title.trim()
  useEffect(() => {
    if (isDesktop()) void getCurrentWindow().setTitle(title || "Untitled card")
  }, [title])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [close])

  return (
    <div className="flex h-svh flex-col overflow-y-auto bg-card text-sm text-card-foreground">
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
                onFlush={flush}
                onClose={close}
                onDelete={() => {
                  deleteCard(cardId)
                  close()
                }}
                onReveal={() => revealInMain({ cardId, deckId })}
                inWindow
              />
            </MobileOverride>
          </DeckProvider>
        )}
      </div>
    </div>
  )
}
