import { useMemo } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { cardDisplayId, type Card } from "@doska/contract"
import type { WikilinkOption } from "@doska/markdown"
import type { Board } from "@/lib/types"
import { keys } from "@/lib/data/keys"
import { useBoard } from "@/lib/data/queries"
import { useDeck } from "../../deck/deck-context"

const NO_CARDS: Card[] = []

/** A card with no number yet has no display id, so it can't be referenced. */
function referenceable(cards: Card[], prefix: string) {
  return cards.flatMap((card) => {
    const displayId = cardDisplayId(prefix, card.number)
    return displayId ? [{ card, displayId }] : []
  })
}

/**
 * Cards the `[[` menu can offer, in board order. `excludeCardId` drops the card
 * being edited, since a card referencing itself is never useful.
 */
export function useCardRefOptions(excludeCardId?: string): WikilinkOption[] {
  const { id: deckId, prefix } = useDeck()
  const { data: board } = useBoard(deckId)
  const cards = board?.cards ?? NO_CARDS

  return useMemo(
    () =>
      referenceable(cards, prefix)
        .filter(({ card }) => card.id !== excludeCardId)
        .map(({ card, displayId }) => ({
          id: card.id,
          title: card.title || "Untitled card",
          hint: displayId,
          target: displayId,
        })),
    [cards, prefix, excludeCardId]
  )
}

export interface ResolvedCardRef {
  card: Card
  /** The column the card sits in — its status, in most people's boards. */
  columnTitle: string
  /** The column's palette color id; empty when it has none. */
  columnColor: string
}

/**
 * Resolves the display id in a `[[ROAD-12]]` reference back to a card on the
 * open board, with the column it currently sits in. Undefined when the id
 * matches nothing — the card was deleted, or the id was typed by hand and
 * never existed.
 */
export function useCardRef(displayId: string): ResolvedCardRef | undefined {
  const { id: deckId, prefix } = useDeck()

  // read from cache
  const qc = useQueryClient()
  const board = qc.getQueryData<Board>(keys.board(deckId))

  const cards = board?.cards ?? NO_CARDS
  const columns = board?.columns

  return useMemo(() => {
    const wanted = displayId.trim().toLowerCase()
    const match = referenceable(cards, prefix).find(
      (entry) => entry.displayId.toLowerCase() === wanted
    )
    if (!match) return undefined
    const column = columns?.find((c) => c.id === match.card.columnId)
    return {
      card: match.card,
      columnTitle: column?.title ?? "",
      columnColor: column?.color ?? "",
    }
  }, [cards, columns, prefix, displayId])
}
