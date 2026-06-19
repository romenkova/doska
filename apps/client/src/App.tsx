import { useEffect, useState } from "react"
import type { DropResult } from "@hello-pangea/dnd"
import { useLocation } from "wouter"
import { SidebarInset, SidebarProvider } from "./components/ui"
import { AppSidebar, Deck, Home } from "@/components/domain"
import type { Card, Dashboard } from "@/lib/types"
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
    title: "",
    position: 0,
  }

  useEffect(() => {
    if (dashboardsLoading || !deckId || active) return
    navigate("~/")
  }, [dashboardsLoading, deckId, active, navigate])

  function handleCreateDashboard() {
    createDashboard("Untitled board", {
      onSuccess: (created) => navigate(`~${routes.deck.to(created.id)}`),
    })
  }

  const { data: board, isPending } = useBoard(dashboard.id)
  const { mutate: createCard } = useCreateCard(dashboard.id)
  const { mutate: deleteCard } = useDeleteCard(dashboard.id)
  const { mutate: moveCard } = useMoveCard(dashboard.id)

  function handleDragEnd({ source, destination }: DropResult) {
    if (!destination || !board) return
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return

    // Group cards by column, ordered by position, to mirror what the UI renders.
    const byColumn = new Map<string, Card[]>(board.columns.map((c) => [c.id, []]))
    for (const card of [...board.cards].sort((a, b) => a.position - b.position)) {
      byColumn.get(card.columnId)?.push(card)
    }

    const from = byColumn.get(source.droppableId)
    const to = byColumn.get(destination.droppableId)
    if (!from || !to) return

    const [moved] = from.splice(source.index, 1)
    if (!moved) return
    to.splice(destination.index, 0, moved)

    // Reindex the affected column(s); emit only the cards that actually moved.
    const original = new Map(board.cards.map((c) => [c.id, c]))
    const changed: Card[] = []
    for (const columnId of new Set([
      source.droppableId,
      destination.droppableId,
    ])) {
      byColumn.get(columnId)?.forEach((card, position) => {
        const prev = original.get(card.id)
        if (prev?.position !== position || prev?.columnId !== columnId) {
          changed.push({ ...card, position, columnId })
        }
      })
    }
    if (changed.length) moveCard(changed)
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
