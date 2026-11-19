import { useLocation, useRoute } from "wouter"
import { useCardRef } from "@doska/core"
import { columnHue, MdWikilink } from "@doska/ui-kit"
import { useIsArchived } from "@/lib/archive-prototype"
import { routes } from "@/lib/routes"
import { revealInMain } from "@/components/card-window/card-window-event"
import { useDeck } from "@/providers/deck/deck-context"

/**
 * A `[[12]]` reference rendered inside a card body: the card's id, then
 * its title, then a pill for the column it sits in, tinted with that
 * column's color.
 */
export function CardRefLink({
  displayId,
  alias,
}: {
  displayId: string
  alias?: string
}) {
  const [, navigate] = useLocation()
  const [inWindow] = useRoute(routes.cardWindow.pattern)
  const { id: deckId } = useDeck()
  const ref = useCardRef(deckId, displayId)
  const isArchived = useIsArchived(ref?.card.id ?? null)

  if (!ref)
    return (
      <MdWikilink
        target={displayId}
        label={alias}
        unresolved
        title="No such card"
      />
    )

  const { card, columnTitle, columnColor, columnDone } = ref
  const title = alias || card.title || "Untitled card"
  const suffix = isArchived ? "archived" : columnTitle
  const tooltip = suffix ? `${title} — ${suffix}` : title

  return (
    <MdWikilink
      target={displayId}
      label={title}
      badge={columnTitle || undefined}
      hue={columnHue(columnColor)}
      done={columnDone}
      archived={isArchived}
      title={tooltip}
      onOpen={() =>
        inWindow
          ? revealInMain({ cardId: card.id, deckId })
          : navigate(routes.card.to(card.id))
      }
    />
  )
}
