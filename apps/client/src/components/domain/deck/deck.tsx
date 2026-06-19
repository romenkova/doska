import { DragDropContext, type DropResult } from "@hello-pangea/dnd"
import type { Board, Dashboard } from "@/lib/types"
import { byPosition, cn } from "@/lib/utils"
import { routes } from "@/lib/routes"
import { Column } from "../column/column"
import { DraggableCard } from "../draggable-card/draggable-card"
import { CardModal } from "../card-modal/card-modal"
import { DeckHeader } from "./deck-header"

interface IProps {
  dashboard: Dashboard
  board: Board
  isLoading: boolean
  showBodyFor: (columnId: string) => boolean
  onToggleBody: (columnId: string) => void
  onAddCard: (columnId: string) => void
  onDeleteCard: (id: string) => void
  onRenameDashboard: (name: string) => void
  onDeleteDashboard: () => void
  onDragEnd: (result: DropResult) => void
}

export function Deck({
  dashboard,
  board,
  isLoading,
  showBodyFor,
  onToggleBody,
  onAddCard,
  onDeleteCard,
  onRenameDashboard,
  onDeleteDashboard,
  onDragEnd,
}: IProps) {
  // Cards grouped by column, ordered by position.
  const cardsByColumn = new Map<string, typeof board.cards>(
    board.columns.map((c) => [c.id, []])
  )
  for (const card of [...board.cards].sort(byPosition)) {
    cardsByColumn.get(card.columnId)?.push(card)
  }
  const columns = [...board.columns].sort(byPosition)

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <DeckHeader
        title={dashboard.title}
        onRename={onRenameDashboard}
        onDelete={onDeleteDashboard}
      />
      <DragDropContext onDragEnd={onDragEnd}>
        <div
          className={cn(
            "flex min-h-0 w-full flex-1 items-start gap-6 overflow-auto px-6",
            "transition-opacity duration-1000",
            isLoading ? "opacity-0" : "opacity-100"
          )}
        >
          {columns.map((column) => {
            const cards = cardsByColumn.get(column.id) ?? []
            const showBody = showBodyFor(column.id)
            return (
              <Column
                key={column.id}
                id={column.id}
                title={column.title}
                showBody={showBody}
                onToggleBody={() => onToggleBody(column.id)}
                onAddCard={() => onAddCard(column.id)}
              >
                {cards.map((card, index) => (
                  <DraggableCard
                    key={card.id}
                    id={card.id}
                    index={index}
                    showBody={showBody}
                    onDelete={() => onDeleteCard(card.id)}
                  />
                ))}
              </Column>
            )
          })}
        </div>
      </DragDropContext>
      <CardModal closeHref={`~${routes.deck.to(dashboard.id)}`} />
    </div>
  )
}
