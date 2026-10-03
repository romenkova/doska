import { priorityRank } from "@doska/tokens"
import type { Card } from "../types"
import { byPosition } from "./position"

export type SortKey = "priority" | "deadline"

/** The sort modes a board offers, in the order they are listed to a person. */
export const SORT_MODES: { id: SortKey; label: string }[] = [
  { id: "priority", label: "Priority" },
  { id: "deadline", label: "Date" },
]

function byDeadline(a: Card, b: Card): number {
  if (a.deadline === b.deadline) return 0
  if (a.deadline === null) return 1
  if (b.deadline === null) return -1
  return a.deadline < b.deadline ? -1 : 1
}

const comparators: Record<SortKey, (a: Card, b: Card) => number> = {
  priority: (a, b) => priorityRank(a.priority) - priorityRank(b.priority),
  deadline: byDeadline,
}

function isSortKey(key: string): key is SortKey {
  return key in comparators
}

/** Two cards the sort cannot tell apart, so their order is theirs to pick. */
export function sameSortGroup(a: Card, b: Card, keys: string[]): boolean {
  return keys.filter(isSortKey).every((key) => comparators[key](a, b) === 0)
}

/**
 * The cards a dropped card is written between. Under a sort only the cards it
 * ties with can hold it in place — a position between two cards the sort ranks
 * apart is undone the moment the list re-sorts.
 *
 * `order` is the destination column as rendered, minus the moved card, so
 * `index` is the slot the card was let go in.
 */
export function dropNeighbours(
  order: Card[],
  index: number,
  moved: Card,
  keys: string[]
): [Card | undefined, Card | undefined] {
  const tied = order
    .map((card, at) => ({ card, at }))
    .filter((entry) => sameSortGroup(entry.card, moved, keys))
  const prev = tied.filter((entry) => entry.at < index).at(-1)?.card
  const next = tied.find((entry) => entry.at >= index)?.card
  if (!prev && !next) return [undefined, order[0]]
  return [prev, next]
}

/** Nothing written on it yet — a card just added, which no key can rank. */
function isBlank(card: Card): boolean {
  return card.title.trim() === "" && card.body.trim() === ""
}

export function sortCards(cards: Card[], keys: string[]): Card[] {
  const active = keys.filter(isSortKey)
  if (active.length === 0) return cards
  return [...cards].sort((a, b) => {
    if (isBlank(a) !== isBlank(b)) return isBlank(a) ? -1 : 1
    for (const key of active) {
      const order = comparators[key](a, b)
      if (order !== 0) return order
    }
    return byPosition(a, b)
  })
}
