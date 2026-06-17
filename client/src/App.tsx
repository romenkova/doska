import { useEffect, useState } from "react"
import type { DropResult } from "@hello-pangea/dnd"
import { useLocation } from "wouter"
import { SidebarInset, SidebarProvider } from "./components/ui"
import { AppSidebar, Deck, Home } from "@/components/domain"
import { BOARD_COLUMNS, type Dashboard } from "@/lib/dashboards"
import { routes } from "@/lib/routes"
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
    name: "",
    columns: BOARD_COLUMNS,
  }

  // Resolve a stale deck link: a `deckId` that points at a board which no longer
  // exists (deleted, or a bad link) lands on the first remaining board, or on the
  // root page if none are left. The root URL itself (no `deckId`) is left alone —
  // it intentionally shows <Home />. Guarded on a loaded list so it doesn't fire
  // mid-fetch.
  useEffect(() => {
    if (dashboardsLoading || !deckId || active) return
    navigate(dashboards.length ? `~${routes.deck.to(dashboards[0].id)}` : "~/")
  }, [dashboardsLoading, deckId, active, dashboards, navigate])

  function handleCreateDashboard() {
    createDashboard("Untitled board", {
      onSuccess: (created) => navigate(`~${routes.deck.to(created.id)}`),
    })
  }

  const { data: items, isPending } = useBoard(dashboard.id)
  const { mutate: createCard } = useCreateCard(dashboard.id)
  const { mutate: deleteCard } = useDeleteCard(dashboard.id)
  const { mutate: moveCard } = useMoveCard(dashboard.id)

  function handleDragEnd({ source, destination }: DropResult) {
    if (!destination || !items) return
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return

    const from = Array.from(items[source.droppableId] ?? [])
    const [moved] = from.splice(source.index, 1)

    if (source.droppableId === destination.droppableId) {
      from.splice(destination.index, 0, moved)
      moveCard({ ...items, [source.droppableId]: from })
      return
    }

    const to = Array.from(items[destination.droppableId] ?? [])
    to.splice(destination.index, 0, moved)
    moveCard({
      ...items,
      [source.droppableId]: from,
      [destination.droppableId]: to,
    })
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
            items={items ?? {}}
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
