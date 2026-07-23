import {
  useCreateCard,
  useCreateColumn,
  useDeleteColumn,
  useDeleteDashboard,
  useMoveCard,
  useMoveColumn,
  useRenameColumn,
  useRenameDashboard,
  useSetColumnCollapsed,
  useSetColumnColor,
  useSetColumnDone,
  useUpdateDashboardPrefix,
} from "@/lib/data/mutations"
import { useBoard, useDashboards } from "@/lib/data/queries"
import { useDragEnd, useSyncShortcut } from "@/lib/hooks"
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

  const { mutate: setColumnCollapsed } = useSetColumnCollapsed(id)
  const { mutate: setColumnColor } = useSetColumnColor(id)
  const { mutate: setColumnDone } = useSetColumnDone(id)

  const { mutate: renameDashboard } = useRenameDashboard()
  const { mutate: updateDashboardPrefix } = useUpdateDashboardPrefix()
  const { mutate: deleteDashboard } = useDeleteDashboard()

  // Every other live board's prefix, for the uniqueness check when editing.
  const { data: dashboards = [] } = useDashboards()
  const takenPrefixes = dashboards
    .filter((d) => d.id !== id)
    .map((d) => d.prefix)

  const { data: board, isPending } = useBoard(id)

  const { mutate: createCard } = useCreateCard(id)
  const { mutate: moveCard } = useMoveCard(id)
  const { mutate: createColumn } = useCreateColumn(id)
  const { mutate: moveColumn } = useMoveColumn(id)
  const { mutate: renameColumn } = useRenameColumn(id)
  const { mutate: deleteColumn } = useDeleteColumn(id)
  const handleDragEnd = useDragEnd(board, moveCard)

  return (
    <Deck
      dashboard={dashboard}
      board={board ?? { columns: [], cards: [] }}
      isLoading={isPending}
      onToggleBody={(columnId, collapsed) =>
        setColumnCollapsed({ id: columnId, collapsed })
      }
      onAddCard={createCard}
      onAddColumn={() => createColumn("New column")}
      onReorderColumns={moveColumn}
      onChangeColumnColor={(columnId, color) =>
        setColumnColor({ id: columnId, color })
      }
      onChangeColumnDone={(columnId, done) =>
        setColumnDone({ id: columnId, done })
      }
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
