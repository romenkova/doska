import { DragDropContext, type DropResult } from "@hello-pangea/dnd"
import type { Board, Dashboard } from "@/lib/types"
import { byPosition } from "@/lib/utils"
import { routes } from "@/lib/routes"
import { Column } from "../column/column"
import { DraggableCard } from "../card/draggable-card"
import { CardModal } from "../card-modal/card-modal"
import { DeckHeader } from "./deck-header"
import { SyncIndicator } from "./sync-indicator"
import { cn } from "@doska/ui-kit"

interface IProps {
  dashboard: Dashboard
  board: Board
  isLoading: boolean
  showBodyFor: (columnId: string) => boolean
  onToggleBody: (columnId: string) => void
  onAddCard: (columnId: string) => void
  onDeleteCard: (id: string) => void
  onMoveCard: (cardId: string, columnId: string) => void
  onAddColumn: () => void
  onReorderColumns: (changed: Board["columns"]) => void
  onRenameColumn: (columnId: string, title: string) => void
  onDeleteColumn: (columnId: string) => void
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
  onMoveCard,
  onAddColumn,
  onReorderColumns,
  onRenameColumn,
  onDeleteColumn,
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
        onAddColumn={onAddColumn}
        columns={columns}
        onReorderColumns={onReorderColumns}
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
                onRename={(title) => onRenameColumn(column.id, title)}
                onDelete={() => onDeleteColumn(column.id)}
              >
                {cards.map((card, index) => (
                  <DraggableCard
                    key={card.id}
                    id={card.id}
                    index={index}
                    showBody={showBody}
                    onDelete={() => onDeleteCard(card.id)}
                    columns={columns}
                    currentColumnId={column.id}
                    onMoveToColumn={(columnId) => onMoveCard(card.id, columnId)}
                  />
                ))}
              </Column>
            )
          })}
        </div>
      </DragDropContext>
      <div className="fixed right-4 bottom-4 z-50">
        <SyncIndicator />
      </div>
      <CardModal closeHref={`~${routes.deck.to(dashboard.id)}`} />
    </div>
  )
}
