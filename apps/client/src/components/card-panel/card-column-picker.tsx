import { generateKeyBetween } from "fractional-indexing"
import { Check, ChevronDown } from "lucide-react"
import { Menu, MenuContent, MenuItem, MenuTrigger, cn } from "@doska/ui-kit"
import { useMoveCard } from "@/lib/data/mutations"
import { useBoard, useCard } from "@/lib/data/queries"
import { byPosition } from "@/lib/utils"
import { useDeck } from "../deck/deck-context"
import { ColumnTag } from "../column/column-tag"

/**
 * Moves the open card between the columns of its board
 */
export function CardColumnPicker({ cardId }: { cardId: string }) {
  const { id: deckId } = useDeck()
  const { data: card } = useCard(cardId)
  const { data: board } = useBoard(deckId)
  const { mutate: moveCard } = useMoveCard(deckId)

  const columns = board?.columns ?? []
  const current = columns.find((c) => c.id === card?.columnId)

  // The board is still loading, or the card's deck hasn't resolved yet.
  if (!card || !current) return null

  function moveTo(columnId: string) {
    if (!card || columnId === card.columnId) return
    // Appended to the end of the target column: a move made from the panel has
    // no drop point to infer a position from.
    const last = (board?.cards ?? [])
      .filter((c) => c.columnId === columnId)
      .sort(byPosition)
      .at(-1)
    moveCard([
      {
        ...card,
        columnId,
        position: generateKeyBetween(last?.position ?? null, null),
      },
    ])
  }

  return (
    <Menu>
      <MenuTrigger
        aria-label={`Column: ${current.title}. Move card`}
        title="Move to another column"
        className={cn(
          "flex cursor-pointer items-center gap-0.5 rounded-full",
          "hover:opacity-80 data-popup-open:opacity-80"
        )}
      >
        <ColumnTag title={current.title} color={current.color} />
        <ChevronDown className="size-3.5 text-muted-foreground" />
      </MenuTrigger>
      <MenuContent>
        {columns.map((column) => (
          <MenuItem key={column.id} onClick={() => moveTo(column.id)}>
            {column.title}
            {column.id === current.id && <Check className="ml-auto" />}
          </MenuItem>
        ))}
      </MenuContent>
    </Menu>
  )
}
