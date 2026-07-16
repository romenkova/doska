import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { derivePrefix } from "@doska/contract"
import { backfillCardNumbers } from "@/lib/api/operations"
import { keys } from "@/lib/data/keys"
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
  useSetColumnCollapsed,
  useUpdateDashboardPrefix,
} from "@/lib/data/mutations"
import { useBoard, useDashboards } from "@/lib/data/queries"
import {
  useDragEnd,
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

  const qc = useQueryClient()

  const { mutate: setColumnCollapsed } = useSetColumnCollapsed(id)

  const { mutate: renameDashboard } = useRenameDashboard()
  const { mutate: updateDashboardPrefix } = useUpdateDashboardPrefix()
  const { mutate: deleteDashboard } = useDeleteDashboard()

  // Every other live board's prefix, for the uniqueness check when editing.
  const { data: dashboards = [] } = useDashboards()
  const takenPrefixes = dashboards
    .filter((d) => d.id !== id)
    .map((d) => d.prefix)

  // Give boards created before card ids a prefix the first time they're opened.
  useEffect(() => {
    if (!dashboard.prefix)
      updateDashboardPrefix({
        id,
        prefix: derivePrefix(dashboard.title, takenPrefixes),
      })
    // Only react to this board's own prefix/title; taken list is read at fire time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, dashboard.prefix, dashboard.title])

  const { data: board, isPending } = useBoard(id)

  // Number any cards that predate card ids so their id shows too; the server
  // adopts these on sync. Runs only while some live card still lacks a number.
  const needsCardBackfill =
    board?.cards.some((c) => c.number == null && c.deletedAt === null) ?? false
  useEffect(() => {
    if (!needsCardBackfill || !board) return
    void backfillCardNumbers(board.cards).then((ids) => {
      if (ids.length === 0) return
      qc.invalidateQueries({ queryKey: keys.board(id) })
      for (const cardId of ids)
        qc.invalidateQueries({ queryKey: keys.card(cardId) })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, needsCardBackfill])

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
      onToggleBody={(columnId, collapsed) =>
        setColumnCollapsed({ id: columnId, collapsed })
      }
      onAddCard={createCard}
      onDeleteCard={deleteCard}
      onMoveCard={moveCardToColumn}
      onAddColumn={() => createColumn("New column")}
      onReorderColumns={moveColumn}
      onRenameColumn={(columnId, title) => renameColumn({ id: columnId, title })}
      onDeleteColumn={deleteColumn}
      onRenameDashboard={(name) => renameDashboard({ id, name })}
      onRenameDashboardPrefix={(prefix) =>
        updateDashboardPrefix({ id, prefix })
      }
      takenPrefixes={takenPrefixes}
      onDeleteDashboard={() => deleteDashboard(id)}
      onDragEnd={handleDragEnd}
    />
  )
}
