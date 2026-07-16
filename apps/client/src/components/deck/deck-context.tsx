import { createContext, useContext } from "react"

/**
 * The open board's card id prefix (the `ROAD` in `ROAD-12`). Anything rendering
 * a card — on the board or in its modal — reads it from here rather than having
 * it threaded down. Empty outside a board, and on boards created before card ids.
 */
const DeckPrefixContext = createContext("")

export const DeckPrefixProvider = DeckPrefixContext.Provider

export function useDeckPrefix() {
  return useContext(DeckPrefixContext)
}
