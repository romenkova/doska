import { useLocation } from "wouter"
import { columnHue, MdWikilink } from "@doska/ui-kit"
import { findCardByRef, type Card, type Column } from "@doska/core"
import { routes } from "@/lib/routes"

interface IProps {
  displayId: string
  alias?: string
  cards: Card[]
  columns: Column[]
}

/**
 * A `[[12]]` reference resolved against the snapshot. A reference to a card
 * on another board is unresolved here by construction — the payload only ever
 * holds this one board.
 */
export function PublicCardRefLink({
  displayId,
  alias,
  cards,
  columns,
}: IProps) {
  const [, navigate] = useLocation()

  const card = findCardByRef(cards, displayId)

  if (!card)
    return (
      <MdWikilink
        target={displayId}
        label={alias}
        unresolved
        title="No such card"
      />
    )

  const column = columns.find((one) => one.id === card.columnId)
  const title = alias || card.title || "Untitled card"
  const columnTitle = column?.title ?? ""

  return (
    <MdWikilink
      target={displayId}
      label={title}
      badge={columnTitle || undefined}
      hue={columnHue(column?.color ?? "")}
      done={column?.done ?? false}
      title={columnTitle ? `${title} — ${columnTitle}` : title}
      onOpen={() => navigate(routes.card.to(card.id))}
    />
  )
}
