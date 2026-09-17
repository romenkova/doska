import { MenuContent, MenuItem, MenuSub, MenuSubTrigger } from "@doska/ui-kit"
import { generateKeyBetween } from "fractional-indexing"
import { ArrowRightLeft } from "lucide-react"
import { useMoveCard } from "@doska/core/mutations"
import { useBoard } from "@doska/core/queries"
import { byPosition } from "@doska/core/utils"
import { createElement } from "react"
import { toast } from "react-hot-toast"
import { CardMoveToast } from "@/components/toasts/card-move/card-move-toast"
import { useDeck } from "@/providers/deck/deck-context"

const TOAST_ID = "card-move"

export function MoveToColumnSub({ cardId }: { cardId: string }) {
  const { id: deckId } = useDeck()
  const { data: board } = useBoard(deckId)
  const { mutate: moveCard } = useMoveCard(deckId)

  const columns = [...(board?.columns ?? [])].sort(byPosition)
  const moved = board?.cards.find((c) => c.id === cardId)

  function moveTo(columnId: string) {
    const column = columns.find((c) => c.id === columnId)
    if (!board || !moved || !column || moved.columnId === columnId) return

    const destCards = board.cards
      .filter((c) => c.columnId === columnId && c.id !== cardId)
      .sort(byPosition)
    const first = destCards[0]
    const position = generateKeyBetween(null, first?.position ?? null)

    moveCard([{ ...moved, columnId, position }])
    toast.custom(
      (toastInstance) =>
        createElement(CardMoveToast, {
          visible: toastInstance.visible,
          title: column.title,
        }),
      { id: TOAST_ID, duration: 2500 }
    )
  }

  return (
    <MenuSub>
      <MenuSubTrigger>
        <ArrowRightLeft />
        Move to
      </MenuSubTrigger>
      <MenuContent align="start" sideOffset={2}>
        {columns.map((column) => (
          <MenuItem
            key={column.id}
            disabled={column.id === moved?.columnId}
            onClick={() => moveTo(column.id)}
            className="data-disabled:pointer-events-none data-disabled:opacity-50"
          >
            {column.title}
          </MenuItem>
        ))}
      </MenuContent>
    </MenuSub>
  )
}
