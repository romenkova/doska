import { Checkbox, cn } from "@doska/ui-kit"
import type { DigestCard, CardPatch } from "@doska/core"
import { Card } from "../card/card"
import { ColumnSwatch } from "../column/column-swatch"

interface IProps {
  entry: DigestCard
  isActive: boolean
  /** Off inside a single board, where every row names the same board. */
  showBoard?: boolean
  /** False when the board has no done column: the checkbox explains instead. */
  canToggleDone: boolean
  onOpen: () => void
  onToggleDone: () => void
  onOpenBoard: () => void
  onPatch: (id: string, patch: CardPatch) => void
}

/** One card in the digest: the board card itself, collapsed, with a tick box on
 * the title row and where it lives on the meta row. */
export function DigestRow({
  entry,
  isActive,
  showBoard = true,
  canToggleDone,
  onOpen,
  onToggleDone,
  onOpenBoard,
  onPatch,
}: IProps) {
  const { card, column, boardTitle, columnTitle, isDone } = entry

  return (
    <Card
      card={card}
      column={column}
      showBody={false}
      isDragging={false}
      imageCard={false}
      onPatch={onPatch}
      onClick={onOpen}
      className={cn(
        "mb-0 max-w-none",
        isActive && "ring-2 ring-primary/40",
        // The board shows done by the column a card sits in; a row has to say
        // so itself, and the title is the card's own markup to reach into.
        isDone && "opacity-40 [&_[data-slot=card-title]]:line-through"
      )}
      lead={
        <span
          onClick={(e) => e.stopPropagation()}
          className="inline-flex pt-0.5"
        >
          <Checkbox
            variant={canToggleDone ? "default" : "dashed"}
            checked={isDone}
            className="mt-px"
            readOnly={!canToggleDone}
            aria-label={
              canToggleDone ? "Toggle done" : "How marking cards done works"
            }
            onClick={() => {
              if (!canToggleDone) onToggleDone()
            }}
            onCheckedChange={() => {
              if (canToggleDone) onToggleDone()
            }}
          />
        </span>
      }
      metaLead={
        showBoard ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onOpenBoard()
            }}
            className="flex min-w-0 items-center gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <ColumnSwatch color={column.color} />
            <span className="truncate hover:underline">
              {boardTitle || "Untitled board"} · {columnTitle}
            </span>
          </button>
        ) : (
          <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
            <ColumnSwatch color={column.color} />
            <span className="truncate">{columnTitle}</span>
          </span>
        )
      }
    />
  )
}
