import { createContext, useContext } from "react"

export interface DeckContextValue {
  /** The open board's id. */
  id: string
  /** The board's active sort keys — empty when its cards sit where they were dropped. */
  sort: string[]
  tagFilters?: string[]
  toggleTagFilter?: (tag: string) => void
}

/**
 * The open board's identity. Anything rendering a card — on the board or in the
 * card panel — reads it from here rather than having it threaded down. Provided
 * at the app root, since the panel is a sibling of the board rather than a
 * child. Both are empty outside a board.
 */
const DeckContext = createContext<DeckContextValue>({
  id: "",
  sort: [],
})

export const DeckProvider = DeckContext.Provider

export function useDeck() {
  return useContext(DeckContext)
}

export function useDeckSort() {
  return useContext(DeckContext).sort
}
