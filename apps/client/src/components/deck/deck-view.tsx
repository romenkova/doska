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
  useSetDashboardSort,
  useUpdateDashboardPrefix,
} from "@/lib/data/mutations"
import { useBoard, useDashboards } from "@/lib/data/queries"
import { modals, useDragEnd, useModal, useSyncShortcut } from "@/lib/hooks"
import type { Dashboard } from "@/lib/types"
import { ConfirmDialog } from "../confirm-dialog"
import { Deck } from "./deck"
import { BoardSettingsModal } from "./board-settings/board-settings-modal"

/**
 * Connects the open board to its data: loads it, wires the card/dashboard
 * mutations and drag-reorder, and renders the presentational {@link Deck}.
 */
export function DeckView({ dashboard }: { dashboard: Dashboard }) {
  const id = dashboard.id

  // ⌘S / Ctrl+S flushes a sync immediately
  useSyncShortcut()

  const { mutate: setColumnCollapsed } = useSetColumnCollapsed(id)

  const { mutate: renameDashboard } = useRenameDashboard()
  const { mutate: updateDashboardPrefix } = useUpdateDashboardPrefix()
  const { mutate: setDashboardSort } = useSetDashboardSort()
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
  const handleDragEnd = useDragEnd(board, moveCard, dashboard.sort === "deadline")

  // Board settings and its delete confirmation open off `?modal=`, so the header
  // (and any future trigger) only has to set the param — see `useModal`.
  const { active, open, close } = useModal()

  return (
    <>
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
        onRenameColumn={(columnId, title) =>
          renameColumn({ id: columnId, title })
        }
        onDeleteColumn={deleteColumn}
        onRenameDashboard={(name) => renameDashboard({ id, name })}
        onToggleSort={() =>
          setDashboardSort({
            id,
            sort: dashboard.sort === "deadline" ? "manual" : "deadline",
          })
        }
        onDragEnd={handleDragEnd}
      />
      <BoardSettingsModal
        open={active === modals.boardSettings}
        onOpenChange={(isOpen) => {
          if (!isOpen) close()
        }}
        prefix={dashboard.prefix ?? ""}
        takenPrefixes={takenPrefixes}
        onRenamePrefix={(prefix) => updateDashboardPrefix({ id, prefix })}
        onRequestDelete={() => open(modals.boardDelete)}
      />
      <ConfirmDialog
        open={active === modals.boardDelete}
        onOpenChange={(isOpen) => {
          if (!isOpen) close()
        }}
        title="Delete board?"
        description={`"${dashboard.title}" and all of its columns and cards will be permanently deleted.`}
        confirmLabel="Delete board"
        onConfirm={() => deleteDashboard(id)}
      />
    </>
  )
}
