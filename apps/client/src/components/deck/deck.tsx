import { useState } from "react"
import { DragDropContext, type DropResult } from "@hello-pangea/dnd"
import type { Board, Dashboard } from "@/lib/types"
import { byPosition } from "@/lib/utils"
import { Column } from "../column/column"
import { DraggableCard } from "../card/draggable-card"
import { DeckHeader } from "./deck-header"
import { SyncIndicator } from "./sync-indicator"
import { cn } from "@doska/ui-kit"

interface IProps {
  dashboard: Dashboard
  board: Board
  isLoading: boolean
  onToggleBody: (columnId: string, collapsed: boolean) => void
  onAddCard: (columnId: string) => void
  onAddColumn: () => void
  onReorderColumns: (changed: Board["columns"]) => void
  onChangeColumnColor: (columnId: string, color: string) => void
  onRenameColumn: (columnId: string, title: string) => void
  onDeleteColumn: (columnId: string) => void
  onRenameDashboard: (name: string) => void
  onRenameDashboardPrefix: (prefix: string) => void
  takenPrefixes: string[]
  onDeleteDashboard: () => void
  onDragEnd: (result: DropResult) => void
}

export function Deck({
  dashboard,
  board,
  isLoading,
  onToggleBody,
  onAddCard,
  onAddColumn,
  onReorderColumns,
  onChangeColumnColor,
  onRenameColumn,
  onDeleteColumn,
  onRenameDashboard,
  onRenameDashboardPrefix,
  takenPrefixes,
  onDeleteDashboard,
  onDragEnd,
}: IProps) {
  const [isDragging, setIsDragging] = useState(false)

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
        prefix={dashboard.prefix ?? ""}
        takenPrefixes={takenPrefixes}
        onRename={onRenameDashboard}
        onRenamePrefix={onRenameDashboardPrefix}
        onDelete={onDeleteDashboard}
        onAddColumn={onAddColumn}
        columns={columns}
        onReorderColumns={onReorderColumns}
      />
      <DragDropContext
        onDragStart={() => setIsDragging(true)}
        onDragEnd={(result) => {
          setIsDragging(false)
          onDragEnd(result)
        }}
      >
        <div
          className={cn(
            "flex min-h-0 w-full flex-1 items-stretch gap-6 overflow-x-auto overflow-y-hidden overscroll-x-contain px-6",
            !isDragging && "snap-x snap-mandatory scroll-px-6 md:snap-none",
            "transition-opacity duration-1000",
            isLoading ? "opacity-0" : "opacity-100"
          )}
        >
          {columns.map((column) => {
            const cards = cardsByColumn.get(column.id) ?? []
            const showBody = !column.collapsed
            return (
              <Column
                key={column.id}
                id={column.id}
                title={column.title}
                color={column.color}
                showBody={showBody}
                onToggleBody={() => onToggleBody(column.id, showBody)}
                onAddCard={() => onAddCard(column.id)}
                onRename={(title) => onRenameColumn(column.id, title)}
                onChangeColor={(color) => onChangeColumnColor(column.id, color)}
                onDelete={() => onDeleteColumn(column.id)}
              >
                {cards.map((card, index) => (
                  <DraggableCard
                    key={card.id}
                    id={card.id}
                    index={index}
                    showBody={showBody}
                  />
                ))}
              </Column>
            )
          })}
        </div>
      </DragDropContext>
      <div className="absolute right-4 bottom-4 z-50">
        <SyncIndicator />
      </div>
    </div>
  )
}
