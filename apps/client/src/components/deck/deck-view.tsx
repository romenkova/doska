import {
  useCreateCard,
  useCreateColumn,
  useDeleteCard,
  useDeleteColumn,
  useDeleteDashboard,
  useMoveCard,
  useMoveColumn,
  useRenameColumn,
  useRenameDashboard,
} from "@/lib/data/mutations"
import { useBoard } from "@/lib/data/queries"
import {
  useDragEnd,
  useHiddenBodies,
  useMoveCardToColumn,
  useSyncShortcut,
} from "@/lib/hooks"
import type { Dashboard } from "@/lib/types"
import { Deck } from "./deck"

/**
 * Connects the open board to its data: loads it, wires the card/dashboard
 * mutations and drag-reorder, and renders the presentational {@link Deck}.
 */
export function DeckView({ dashboard }: { dashboard: Dashboard }) {
  const id = dashboard.id

  // ⌘S / Ctrl+S flushes a sync immediately
  useSyncShortcut()

  const { showBody, toggleBody } = useHiddenBodies()

  const { mutate: renameDashboard } = useRenameDashboard()
  const { mutate: deleteDashboard } = useDeleteDashboard()

  const { data: board, isPending } = useBoard(id)
  const { mutate: createCard } = useCreateCard(id)
  const { mutate: deleteCard } = useDeleteCard(id)
  const { mutate: moveCard } = useMoveCard(id)
  const { mutate: createColumn } = useCreateColumn(id)
  const { mutate: moveColumn } = useMoveColumn(id)
  const { mutate: renameColumn } = useRenameColumn(id)
  const { mutate: deleteColumn } = useDeleteColumn(id)
  const handleDragEnd = useDragEnd(board, moveCard)
  const moveCardToColumn = useMoveCardToColumn(board, moveCard)

  return (
    <Deck
      dashboard={dashboard}
      board={board ?? { columns: [], cards: [] }}
      isLoading={isPending}
      showBodyFor={showBody}
      onToggleBody={toggleBody}
      onAddCard={createCard}
      onDeleteCard={deleteCard}
      onMoveCard={moveCardToColumn}
      onAddColumn={() => createColumn("New column")}
      onReorderColumns={moveColumn}
      onRenameColumn={(columnId, title) => renameColumn({ id: columnId, title })}
      onDeleteColumn={deleteColumn}
      onRenameDashboard={(name) => renameDashboard({ id, name })}
      onDeleteDashboard={() => deleteDashboard(id)}
      onDragEnd={handleDragEnd}
    />
  )
}
