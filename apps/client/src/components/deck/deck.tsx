import { useState } from "react"
import { DragDropContext, type DropResult } from "@hello-pangea/dnd"
import type { Board, Dashboard, DashboardView } from "@doska/core/types"
import {
  byPosition,
  filterByTags,
  groupCardsByColumn,
  sortCards,
} from "@doska/core/utils"
import type { CardPatch } from "@doska/core/mutations"
import { useLandingSlot } from "@/lib/hooks"
import { useDeck } from "@/providers/deck/deck-context"
import { Column } from "../column/column"
import { AddColumn } from "../column/add-column"
import { DraggableCard } from "../card/draggable-card"
import { BoardView } from "./board-view"
import { DragStateProvider } from "./drag-state"
import { DeckHeader } from "./deck-header/deck-header"
import { TagFilterPills } from "./deck-header/tag-filter-pills"
import { DeckRowsView } from "./deck-rows-view"
import { SyncIndicator } from "./sync-indicator"
import { useSidebarCardDrop } from "./use-sidebar-card-drop"

interface IProps {
  dashboard: Dashboard
  board: Board
  isLoading: boolean
  onToggleBody: (columnId: string, collapsed: boolean) => void
  onAddCard: (columnId: string) => void
  /** Creates a card and opens it, for the header's add. */
  onAddAndOpenCard: (columnId: string) => void
  onAddColumn: () => void
  onReorderColumns: (changed: Board["columns"]) => void
  onChangeColumnColor: (columnId: string, color: string) => void
  onChangeColumnDone: (columnId: string, done: boolean) => void
  onRenameColumn: (columnId: string, title: string) => void
  onDeleteColumn: (columnId: string) => void
  onRenameDashboard: (name: string) => void
  onDeleteDashboard: () => void
  onChangeSort: (sort: string[]) => void
  view: DashboardView
  onChangeView: (view: DashboardView) => void
  onDragEnd: (result: DropResult) => void
  onMoveCardToBoard: (move: { id: string; boardId: string }) => void
  onPatchCard: (id: string, patch: CardPatch) => void
}

export function Deck({
  dashboard,
  board,
  isLoading,
  onToggleBody,
  onAddCard,
  onAddAndOpenCard,
  onAddColumn,
  onReorderColumns,
  onChangeColumnColor,
  onChangeColumnDone,
  onRenameColumn,
  onDeleteColumn,
  onRenameDashboard,
  onDeleteDashboard,
  onChangeSort,
  view,
  onChangeView,
  onDragEnd,
  onMoveCardToBoard,
  onPatchCard,
}: IProps) {
  const [isDragging, setIsDragging] = useState(false)
  const sidebarDrop = useSidebarCardDrop(isDragging)

  const { tagFilters = [] } = useDeck()
  const isFiltered = tagFilters.length > 0
  const visible = { ...board, cards: filterByTags(board.cards, tagFilters) }
  const grouped = groupCardsByColumn(visible)
  const orderedColumns = [...board.columns].sort(byPosition)
  const sort = dashboard.sort ?? []
  const { hold, release, place } = useLandingSlot(sort.length > 0)

  return (
    <DragStateProvider value={isDragging}>
      <DragDropContext
        onDragStart={() => setIsDragging(true)}
        onDragEnd={(result) => {
          setIsDragging(false)
          const boardId = sidebarDrop.takeDrop()
          if (boardId) {
            onMoveCardToBoard({ id: result.draggableId, boardId })
            return
          }
          hold(result)
          onDragEnd(result)
        }}
      >
        <BoardView
          isLoading={isLoading}
          isDragging={isDragging}
          footer={<SyncIndicator />}
          header={
            <>
              <DeckHeader
                boardId={dashboard.id}
                title={dashboard.title}
                onRename={onRenameDashboard}
                onDelete={onDeleteDashboard}
                columns={orderedColumns}
                onReorderColumns={onReorderColumns}
                sort={sort}
                onChangeSort={onChangeSort}
                view={view}
                onChangeView={onChangeView}
                onAddCard={
                  orderedColumns[0] && !isFiltered
                    ? () => onAddAndOpenCard(orderedColumns[0].id)
                    : undefined
                }
              />
              <TagFilterPills />
            </>
          }
        >
          {view === "rows" ? (
            <DeckRowsView board={visible} title={dashboard.title} />
          ) : (
            <>
              {grouped.map(({ column, cards }) => {
                const ordered = place(sortCards(cards, sort), column.id)
                const showBody = !column.collapsed
                return (
                  <Column
                    key={column.id}
                    id={column.id}
                    title={column.title}
                    color={column.color}
                    showBody={showBody}
                    onToggleBody={() => onToggleBody(column.id, showBody)}
                    onAddCard={
                      isFiltered ? undefined : () => onAddCard(column.id)
                    }
                    onRename={(title) => onRenameColumn(column.id, title)}
                    onChangeColor={(color) =>
                      onChangeColumnColor(column.id, color)
                    }
                    done={column.done}
                    onChangeDone={(done) => onChangeColumnDone(column.id, done)}
                    onDelete={() => onDeleteColumn(column.id)}
                  >
                    {ordered.map((card, index) => (
                      <DraggableCard
                        key={card.id}
                        card={card}
                        column={column}
                        index={index}
                        showBody={showBody}
                        compact={sidebarDrop.overSidebar}
                        vanishOnDrop={sidebarDrop.landing}
                        onPatch={onPatchCard}
                        onDropSettled={release}
                      />
                    ))}
                  </Column>
                )
              })}
              <AddColumn onAdd={onAddColumn} />
            </>
          )}
        </BoardView>
      </DragDropContext>
    </DragStateProvider>
  )
}
