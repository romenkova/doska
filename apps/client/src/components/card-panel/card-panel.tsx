import { cn } from "@doska/ui-kit"
import { useEffect, useState, type CSSProperties } from "react"
import { useLocation, useRoute } from "wouter"
import { routes } from "@/lib/routes"
import { CardEditor } from "./card-editor"
import { useCardSave } from "./use-card-save"
import { usePanelResize } from "./use-panel-resize"
import { useCard } from "@/lib/data/queries"
import type { Card } from "@/lib/types"

interface IProps {
  /** Where to navigate when the panel closes (its deck root). */
  closeHref: string
}

/**
 * Deadline edits commit straight from {@link CardMeta}, so they never land here.
 * The draft only backs the textareas — round-tripping every keystroke through the
 * store would lag the caret. Writes go out in parallel, via {@link useCardSave}.
 */
type Draft = Partial<Pick<Card, "title" | "body">>

export function CardPanel({ closeHref }: IProps) {
  const [, navigate] = useLocation()
  const [, routeParams] = useRoute(routes.card.pattern)
  const routeId = routeParams?.id ?? null

  const [card, setCard] = useState(routeId)
  const [draft, setDraft] = useState<Draft>({})
  const [preview, setPreview] = useState<boolean | null>(null)
  const { width, isResizing, startResizing, resetWidth } = usePanelResize()

  const isNewCard = routeId != null && routeId !== card
  if (isNewCard) {
    setCard(routeId)
    setDraft({})
    setPreview(null)
  }

  const { data: content } = useCard(card)
  const { queue, flush } = useCardSave()

  if (!isNewCard && preview === null && content) {
    setPreview(Boolean(content.body.trim()))
  }

  const isPreview = preview ?? false
  const isOpen = routeId != null

  const edit = (patch: Draft) => {
    if (!card) return
    setDraft((d) => ({ ...d, ...patch }))
    queue(card, patch)
  }

  const close = () => {
    flush()
    navigate(closeHref)
  }

  // The panel is not a dialog, so Escape has to be wired up by hand.
  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  })

  return (
    <div
      style={{ "--card-panel-width": `${width}px` } as CSSProperties}
      className={cn(
        "relative shrink-0 overflow-hidden",
        "max-md:fixed max-md:inset-0 max-md:z-50 max-md:w-full",
        "md:box-border",
        !isResizing && "md:transition-[width] md:duration-200 md:ease-linear",
        isOpen
          ? "md:w-[calc(var(--card-panel-width)+1rem)] md:p-2"
          : "max-md:hidden md:w-0"
      )}
      // Card state outlives the close so content stays put while the width animates.
      onTransitionEnd={(e) => {
        if (e.target === e.currentTarget && !isOpen) setCard(null)
      }}
    >
      {isOpen && (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize card panel"
          onPointerDown={(e) => {
            e.preventDefault()
            startResizing()
          }}
          onDoubleClick={resetWidth}
          className={cn(
            "absolute inset-y-0 left-0 z-20 hidden w-2 md:block",
            "cursor-col-resize touch-none",
            "after:absolute after:inset-y-10 after:left-1/2 after:w-1",
            "after:-translate-x-1/2 after:rounded-full after:bg-primary/50",
            "after:opacity-0 after:transition-opacity",
            isResizing ? "after:opacity-100" : "hover:after:opacity-100"
          )}
        />
      )}
      <div className="flex size-full flex-col overflow-hidden bg-card text-sm text-card-foreground md:w-(--card-panel-width) md:rounded-xl md:ring-1 md:ring-foreground/10 md:ring-inset">
        {card && content && (
          <CardEditor
            cardId={card}
            title={draft.title ?? content.title}
            body={draft.body ?? content.body}
            isPreview={isPreview}
            onChangeTitle={(title) => edit({ title })}
            onChangeBody={(body) => edit({ body })}
            onTogglePreview={() => setPreview(!isPreview)}
            onEdit={() => setPreview(false)}
            onClose={close}
          />
        )}
      </div>
    </div>
  )
}
