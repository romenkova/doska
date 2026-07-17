import type { DropResult } from "@hello-pangea/dnd"
import { generateKeyBetween } from "fractional-indexing"
import type { Board, Card } from "@/lib/types"
import { byPosition } from "@/lib/utils"

/**
 * Builds the drop handler for the board: translates a drag result into the
 * single moved card with a freshly minted fractional position, then persists it.
 *
 * When `byDeadlineSort` is on, cards render by deadline rather than position, so
 * the drop index carries no positional meaning: a same-column drop is ignored
 * (reorder is disabled in this mode) and a cross-column drop appends to the end
 * of the destination column instead of inserting at the drop site.
 */
export function useDragEnd(
  board: Board | undefined,
  moveCard: (changed: Card[]) => void,
  byDeadlineSort: boolean
) {
  return function handleDragEnd({
    source,
    destination,
    draggableId,
  }: DropResult) {
    if (!destination || !board) return

    const sameColumn = source.droppableId === destination.droppableId
    if (sameColumn && source.index === destination.index) return
    // Deadline sort fixes the within-column order; only cross-column moves apply.
    if (byDeadlineSort && sameColumn) return

    const moved = board.cards.find((c) => c.id === draggableId)
    if (!moved) return

    // The destination column as rendered, minus the card being dropped, so the
    // insertion index lines up with the neighbors at the drop site.
    const destCards = board.cards
      .filter(
        (c) => c.columnId === destination.droppableId && c.id !== moved.id
      )
      .sort(byPosition)

    // In deadline mode the drop index is meaningless, so append; otherwise mint
    // a key strictly between the neighbors at the drop site. Either way only the
    // moved card changes, so concurrent reorders never collide with this write.
    const before = byDeadlineSort
      ? destCards[destCards.length - 1]
      : destCards[destination.index - 1]
    const after = byDeadlineSort ? undefined : destCards[destination.index]
    const position = generateKeyBetween(
      before?.position ?? null,
      after?.position ?? null
    )

    moveCard([{ ...moved, columnId: destination.droppableId, position }])
  }
}
