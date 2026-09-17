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
  /** The board a card was just dropped on */
  droppedOn: string | null
  setDroppedOn: (boardId: string | null) => void
}

/**
 * Lets the board tell the sidebar which row a dragged card hovers
 */
const CardDropContext = createContext<CardDropContextValue>({
  target: null,
  setTarget: () => {},
  droppedOn: null,
  setDroppedOn: () => {},
})

export const CardDropProvider = CardDropContext.Provider

export function useCardDrop() {
  return useContext(CardDropContext)
}
