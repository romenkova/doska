import {
  createContext,
  useContext,
  type Dispatch,
  type SetStateAction,
} from "react"

export type CardDropTarget = { kind: "board" | "folder"; id: string }

interface CardDropValue {
  target: CardDropTarget | null
  setTarget: Dispatch<SetStateAction<CardDropTarget | null>>
}

/**
 * Lets the board tell the sidebar which row a dragged card hovers
 */
export const CardDropCtx = createContext<CardDropValue>({
  target: null,
  setTarget: () => {},
})

export function useCardDrop() {
  return useContext(CardDropCtx)
}
