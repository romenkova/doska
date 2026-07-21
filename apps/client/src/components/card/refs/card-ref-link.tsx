import type { CSSProperties } from "react"
import { useLocation } from "wouter"
import { cn, columnHue } from "@doska/ui-kit"
import { routes } from "@/lib/routes"
import { useCardRef } from "./use-card-refs"

/**
 * A `[[ROAD-12]]` reference rendered inside a card body: the card's id, then
 * its title, then a pill for the column it sits in, tinted with that
 * column's color. Everything shown is read live rather than stored in the
 * text, so a rename, a move or a re-color propagates to every reference.
 */
export function CardRefLink({ displayId }: { displayId: string }) {
  const [, navigate] = useLocation()
  const ref = useCardRef(displayId)

  if (!ref)
    return (
      <span className="wikilink wikilink-missing" title="No such card">
        <span className="wikilink-target">{displayId}</span>
      </span>
    )

  const { card, columnTitle, columnColor } = ref
  const title = card.title || "Untitled card"
  const hue = columnHue(columnColor)
  const open = () => navigate(routes.card.to(card.id))

  return (
    <span
      role="link"
      tabIndex={0}
      className="wikilink"
      title={columnTitle ? `${title} — ${columnTitle}` : title}
      // The body sits inside the board card's own open-detail handler.
      onClick={(e) => {
        e.stopPropagation()
        open()
      }}
      onKeyDown={(e) => {
        if (e.key !== "Enter" && e.key !== " ") return
        e.preventDefault()
        e.stopPropagation()
        open()
      }}
    >
      <span className="wikilink-target">{displayId}</span>
      <span className="wikilink-label">{title}</span>
      {columnTitle && (
        <span
          className={cn(
            "wikilink-badge",
            hue !== null && "wikilink-badge-tinted"
          )}
          style={
            hue === null ? undefined : ({ "--wikilink-h": hue } as CSSProperties)
          }
        >
          {columnTitle}
        </span>
      )}
    </span>
  )
}
