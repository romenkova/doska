import { MenuContent, MenuItem, MenuSub, MenuSubTrigger } from "@doska/ui-kit"
import { SquareKanban } from "lucide-react"
import { useMoveCardToBoard } from "@doska/core/mutations"
import { useDashboards } from "@doska/core/queries"
import { createElement } from "react"
import { toast } from "react-hot-toast"
import { CardMoveToast } from "@/components/toasts/card-move/card-move-toast"
import { useDeck } from "@/providers/deck/deck-context"

const TOAST_ID = "card-move"

export function MoveToBoardSub({ cardId }: { cardId: string }) {
  const { id: deckId } = useDeck()
  const { data: boards = [] } = useDashboards()
  const { mutate: moveCardToBoard } = useMoveCardToBoard(deckId)

  function moveTo(boardId: string) {
    const board = boards.find((b) => b.id === boardId)
    if (!board || boardId === deckId) return

    moveCardToBoard({ id: cardId, boardId })
    toast.custom(
      (toastInstance) =>
        createElement(CardMoveToast, {
          visible: toastInstance.visible,
          title: board.title,
        }),
      { id: TOAST_ID, duration: 2500 }
    )
  }

  return (
    <MenuSub>
      <MenuSubTrigger>
        <SquareKanban />
        Move to board
      </MenuSubTrigger>
      <MenuContent align="start" sideOffset={2}>
        {boards.map((board) => (
          <MenuItem
            key={board.id}
            disabled={board.id === deckId}
            onClick={() => moveTo(board.id)}
            className="data-disabled:pointer-events-none data-disabled:opacity-50"
          >
            {board.title}
          </MenuItem>
        ))}
      </MenuContent>
    </MenuSub>
  )
}
