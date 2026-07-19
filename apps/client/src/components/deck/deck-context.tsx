import { createContext, useContext } from "react"

interface DeckContextValue {
  /** The open board's id. */
  id: string
  /** The board's card id prefix (the `ROAD` in `ROAD-12`). */
  prefix: string
}

/**
 * The open board's identity. Anything rendering a card — on the board or in the
 * card panel — reads it from here rather than having it threaded down. Provided
 * at the app root, since the panel is a sibling of the board rather than a
 * child. Both are empty outside a board, and the prefix is empty on boards
 * created before card ids.
 */
const DeckContext = createContext<DeckContextValue>({ id: "", prefix: "" })

export const DeckProvider = DeckContext.Provider

export function useDeck() {
  return useContext(DeckContext)
}

export function useDeckPrefix() {
  return useContext(DeckContext).prefix
}
