import {
  createContext,
  useContext,
  type Dispatch,
  type SetStateAction,
} from "react"

export type CardDropTarget = { kind: "board" | "folder"; id: string }

interface CardDropContextValue {
  target: CardDropTarget | null
  setTarget: Dispatch<SetStateAction<CardDropTarget | null>>
}

/**
 * Lets the board tell the sidebar which row a dragged card hovers
 */
const CardDropContext = createContext<CardDropContextValue>({
  target: null,
  setTarget: () => {},
})

export const CardDropProvider = CardDropContext.Provider

export function useCardDrop() {
  return useContext(CardDropContext)
}
