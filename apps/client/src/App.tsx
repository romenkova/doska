import { useEffect, useState } from "react"
import type { DropResult } from "@hello-pangea/dnd"
import { generateKeyBetween } from "fractional-indexing"
import { useLocation } from "wouter"
import { SidebarInset, SidebarProvider } from "@deck/ui-kit"
import { AppSidebar, Deck, Home } from "@/components"
import type { Dashboard } from "@/lib/types"
import { routes } from "@/lib/routes"
import { byPosition } from "@/lib/utils"
import { setActiveBoard } from "./lib/api/sync"
import {
  useCreateCard,
  useCreateDashboard,
  useDeleteCard,
  useDeleteDashboard,
  useMoveCard,
  useRenameDashboard,
} from "./lib/data/mutations"
import { useBoard, useDashboards } from "./lib/data/queries"

export default function App({ deckId }: { deckId?: string }) {
  const [, navigate] = useLocation()
  const [hiddenBodies, setHiddenBodies] = useState<Record<string, boolean>>({})

  const { data: dashboards = [], isPending: dashboardsLoading } =
    useDashboards()
  const { mutate: createDashboard } = useCreateDashboard()
  const { mutate: renameDashboard } = useRenameDashboard()
  const { mutate: deleteDashboard } = useDeleteDashboard()

  const active = dashboards.find((d) => d.id === deckId)
  const dashboard: Dashboard = active ?? {
    id: deckId ?? "",
    title: "",
    position: generateKeyBetween(null, null),
    deletedAt: null,
    updatedAt: 0,
  }

  useEffect(() => {
    if (dashboardsLoading || !deckId || active) return
    navigate("~/")
  }, [dashboardsLoading, deckId, active, navigate])

  // Point background sync at the open board (and reconcile on switch).
  useEffect(() => {
    setActiveBoard(deckId ?? null)
  }, [deckId])

  function handleCreateDashboard() {
    createDashboard("Untitled board", {
      onSuccess: (created) => navigate(`~${routes.deck.to(created.id)}`),
    })
  }

  const { data: board, isPending } = useBoard(dashboard.id)
  const { mutate: createCard } = useCreateCard(dashboard.id)
  const { mutate: deleteCard } = useDeleteCard(dashboard.id)
  const { mutate: moveCard } = useMoveCard(dashboard.id)

  function handleDragEnd({ source, destination, draggableId }: DropResult) {
    if (!destination || !board) return
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return

    const moved = board.cards.find((c) => c.id === draggableId)
    if (!moved) return

    // The destination column as rendered, minus the card being dropped, so the
    // insertion index lines up with the neighbors at the drop site.
    const destCards = board.cards
      .filter(
        (c) => c.columnId === destination.droppableId && c.id !== moved.id
      )
      .sort(byPosition)

    // Mint a key strictly between the neighbors — only the moved card changes,
    // so concurrent reorders of other cards never collide with this write.
    const before = destCards[destination.index - 1]
    const after = destCards[destination.index]
    const position = generateKeyBetween(
      before?.position ?? null,
      after?.position ?? null
    )

    moveCard([{ ...moved, columnId: destination.droppableId, position }])
  }

  return (
    <SidebarProvider className="h-svh">
      <AppSidebar
        dashboards={dashboards}
        activeDashboardId={dashboard.id}
        onSelectDashboard={(d) => navigate(`~${routes.deck.to(d.id)}`)}
        onCreateDashboard={handleCreateDashboard}
      />
      <SidebarInset className="min-w-0 overflow-hidden">
        {deckId ? (
          <Deck
            dashboard={dashboard}
            board={board ?? { columns: [], cards: [] }}
            isLoading={isPending}
            showBodyFor={(columnId) => !hiddenBodies[columnId]}
            onToggleBody={(columnId) =>
              setHiddenBodies((h) => ({ ...h, [columnId]: !h[columnId] }))
            }
            onAddCard={createCard}
            onDeleteCard={deleteCard}
            onRenameDashboard={(name) =>
              renameDashboard({ id: dashboard.id, name })
            }
            onDeleteDashboard={() => deleteDashboard(dashboard.id)}
            onDragEnd={handleDragEnd}
          />
        ) : (
          <Home
            hasBoards={dashboards.length > 0}
            onCreateDashboard={handleCreateDashboard}
          />
        )}
      </SidebarInset>
    </SidebarProvider>
  )
}
