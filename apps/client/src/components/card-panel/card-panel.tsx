import { cn } from "@doska/ui-kit"
import { useCallback, useEffect, useState, type CSSProperties } from "react"
import { useLocation, useRoute } from "wouter"
import { routes } from "@/lib/routes"
import { CardPane } from "./card-pane"
import { PanelResizeHandle } from "./panel-resize-handle"
import { useCardSave } from "./use-card-save"
import { usePanelResize } from "./use-panel-resize"
import { useCard } from "@/lib/data/queries"

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

  const { width, isResizing, startResizing, resetWidth } = usePanelResize()
  const { queue, flush } = useCardSave()

  const card = routeId ?? lastCard
  const isOpen = routeId != null
  const { data: content } = useCard(card)

  const close = useCallback(() => {
    flush()
    navigate(closeHref)
  }, [flush, navigate, closeHref])

  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [isOpen, close])

  return (
    <div
      style={{ "--card-panel-width": `${width}px` } as CSSProperties}
      className={cn(
        "relative shrink-0 overflow-hidden",
        "max-md:fixed max-md:inset-0 max-md:z-50 max-md:w-full",
        "md:box-border",
        // Resizing must track the pointer, so only the open/close sweep animates.
        !isResizing && "md:transition-[width] md:duration-200 md:ease-linear",
        // The padding is the handle's gutter, so the width covers both.
        isOpen
          ? "md:w-[calc(var(--card-panel-width)+1rem)] md:p-2"
          : "max-md:hidden md:w-0"
      )}
      onTransitionEnd={(e) => {
        if (e.target === e.currentTarget && !isOpen) setLastCard(null)
      }}
    >
      {isOpen && (
        <PanelResizeHandle
          isResizing={isResizing}
          onStartResizing={startResizing}
          onResetWidth={resetWidth}
        />
      )}
      {/* `ring-inset` because the wrapper's overflow clips an outset ring's left edge. */}
      <div className="flex size-full flex-col overflow-hidden bg-card text-sm text-card-foreground md:w-(--card-panel-width) md:rounded-xl md:ring-1 md:ring-foreground/10 md:ring-inset">
        {card && content && (
          <CardPane
            key={card}
            cardId={card}
            content={content}
            onQueue={queue}
            onClose={close}
          />
        )}
      </div>
    </div>
  )
}
