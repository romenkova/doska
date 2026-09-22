import type { DropResult } from "@hello-pangea/dnd"
import type { Board, Card } from "@doska/core/types"
import {
  byPosition,
  dropNeighbours,
  keyBetween,
  sortCards,
} from "@doska/core/utils"
import { filterByTags } from "../tag-filter"

/**
 * Builds the drop handler for the board: translates a drag result into the
 * single moved card with a freshly minted fractional position, then persists it.
 */
export function useDragEnd(
  board: Board | undefined,
  moveCard: (changed: Card[]) => void,
  sort: string[],
  tagFilters: string[] = []
) {
  return function handleDragEnd({
    source,
    destination,
    draggableId,
  }: DropResult) {
    if (!destination || !board) return
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return

    const moved = board.cards.find((c) => c.id === draggableId)
    if (!moved) return

    const column = board.cards
      .filter(
        (c) => c.columnId === destination.droppableId && c.id !== moved.id
      )
      .sort(byPosition)

    // The destination column as rendered, minus the card being dropped, so the
    // insertion index lines up with the neighbors at the drop site.
    const destCards = sortCards(filterByTags(column, tagFilters), sort)

    let [prev, next] = dropNeighbours(destCards, destination.index, moved, sort)

    if (tagFilters.length > 0) {
      if (prev) next = column[column.indexOf(prev) + 1]
      else if (next) prev = column[column.indexOf(next) - 1]
    }

    const position = keyBetween(prev, next)
    if (position === null) return

    moveCard([{ ...moved, columnId: destination.droppableId, position }])
  }
}
