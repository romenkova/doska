import {
  useCreateCard,
  useCreateColumn,
  useDeleteColumn,
  useDeleteDashboard,
  useMoveCard,
  useMoveCardToBoard,
  useSaveCard,
  useMoveColumn,
  useRenameColumn,
  useRenameDashboard,
  useSetColumnCollapsed,
  useSetColumnColor,
  useSetColumnDone,
  useSetDashboardSort,
  type CardPatch,
} from "@doska/core/mutations"
import { useBoard } from "@doska/core/queries"
import { setBoardView, useBoardView } from "@doska/core/board-view"
import { useCallback } from "react"
import { useLocation } from "wouter"
import { useDragEnd, useSyncShortcut } from "@/lib/hooks"
import { routes } from "@/lib/routes"
import type { Dashboard } from "@doska/core/types"
import { Deck } from "./deck"

/**
 * Connects the open board to its data: loads it, wires the card/dashboard
 * mutations and drag-reorder, and renders the presentational {@link Deck}.
 */
export function DeckView({ dashboard }: { dashboard: Dashboard }) {
  const id = dashboard.id
  const [, navigate] = useLocation()

  // ⌘S / Ctrl+S flushes a sync immediately
  useSyncShortcut()

  const { mutate: setColumnCollapsed } = useSetColumnCollapsed(id)
  const { mutate: setColumnColor } = useSetColumnColor(id)
  const { mutate: setColumnDone } = useSetColumnDone(id)

  const { mutate: renameDashboard } = useRenameDashboard()
  const { mutate: deleteDashboard } = useDeleteDashboard()
  const { mutate: setDashboardSort } = useSetDashboardSort()

  const { data: board, isPending } = useBoard(id)

  const view = useBoardView(id)

  const { mutate: createCard } = useCreateCard(id)
  const { mutate: moveCard } = useMoveCard(id)
  const { mutate: moveCardToBoard } = useMoveCardToBoard(id)
  const { mutate: createColumn } = useCreateColumn(id)
  const { mutate: moveColumn } = useMoveColumn(id)
  const { mutate: renameColumn } = useRenameColumn(id)
  const { mutate: deleteColumn } = useDeleteColumn(id)
  const { mutate: saveCard } = useSaveCard()

  const patchCard = useCallback(
    (cardId: string, patch: CardPatch) => saveCard({ id: cardId, patch }),
    [saveCard]
  )

  const handleDragEnd = useDragEnd(board, moveCard, dashboard.sort ?? [])

  return (
    <Deck
      dashboard={dashboard}
      board={board ?? { columns: [], cards: [] }}
      isLoading={isPending}
      onToggleBody={(columnId, collapsed) =>
        setColumnCollapsed({ id: columnId, collapsed })
      }
      onAddCard={createCard}
      onAddAndOpenCard={(columnId) =>
        createCard(columnId, {
          onSuccess: (cardId) => navigate(routes.card.to(cardId)),
        })
      }
      onAddColumn={() => createColumn("New column")}
      onReorderColumns={moveColumn}
      onChangeColumnColor={(columnId, color) =>
        setColumnColor({ id: columnId, color })
      }
      onChangeColumnDone={(columnId, done) =>
        setColumnDone({ id: columnId, done })
      }
      onRenameColumn={(columnId, title) =>
        renameColumn({ id: columnId, title })
      }
      onDeleteColumn={deleteColumn}
      onRenameDashboard={(name) => renameDashboard({ id, name })}
      onDeleteDashboard={() => deleteDashboard(id)}
      onChangeSort={(sort) => setDashboardSort({ id, sort })}
      view={view}
      onChangeView={(next) => setBoardView(id, next)}
      onDragEnd={handleDragEnd}
      onMoveCardToBoard={moveCardToBoard}
      onPatchCard={patchCard}
    />
  )
}
