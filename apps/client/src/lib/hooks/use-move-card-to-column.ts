import { generateKeyBetween } from "fractional-indexing"
import type { Board, Card } from "@/lib/types"
import { byPosition } from "@/lib/utils"

export function useMoveCardToColumn(
  board: Board | undefined,
  moveCard: (changed: Card[]) => void
) {
  return function moveCardToColumn(cardId: string, columnId: string) {
    if (!board) return

    const moved = board.cards.find((c) => c.id === cardId)
    if (!moved || moved.columnId === columnId) return

    const destCards = board.cards
      .filter((c) => c.columnId === columnId && c.id !== moved.id)
      .sort(byPosition)
    const last = destCards[destCards.length - 1]
    const position = generateKeyBetween(last?.position ?? null, null)

    moveCard([{ ...moved, columnId, position }])
  }
}
