import { DragDropContext, type DropResult } from "@hello-pangea/dnd"
import type { BoardItems, Dashboard } from "@/lib/dashboards"
import { cn } from "@/lib/utils"
import { routes } from "@/lib/routes"
import { Column } from "../column/column"
import { DraggableCard } from "../draggable-card/draggable-card"
import { CardModal } from "../card-modal/card-modal"
import { DeckHeader } from "./deck-header"

interface IProps {
  dashboard: Dashboard
  items: BoardItems
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
  items,
  isLoading,
  showBodyFor,
  onToggleBody,
  onAddCard,
  onDeleteCard,
  onRenameDashboard,
  onDeleteDashboard,
  onDragEnd,
}: IProps) {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <DeckHeader
        title={dashboard.name}
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
          {dashboard.columns.map((column) => {
            const ids = items[column.id] ?? []
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
                {ids.map((id, index) => (
                  <DraggableCard
                    key={id}
                    id={id}
                    index={index}
                    showBody={showBody}
                    onDelete={() => onDeleteCard(id)}
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
