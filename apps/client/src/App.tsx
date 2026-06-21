import { SidebarInset, SidebarProvider } from "@doska/ui-kit"
import { AppSidebar, DeckView, Home } from "@/components"
import { useActiveDashboard } from "@/lib/hooks"

export default function App({ deckId }: { deckId?: string }) {
  const { dashboards, dashboard, selectDashboard, createAndOpenDashboard } =
    useActiveDashboard(deckId)

  return (
    <SidebarProvider className="h-svh">
      <AppSidebar
        dashboards={dashboards}
        activeDashboardId={dashboard.id}
        onSelectDashboard={(d) => selectDashboard(d.id)}
        onCreateDashboard={createAndOpenDashboard}
      />
      <SidebarInset className="min-w-0 overflow-hidden">
        {deckId ? (
          <DeckView dashboard={dashboard} />
        ) : (
          <Home
            hasBoards={dashboards.length > 0}
            onCreateDashboard={createAndOpenDashboard}
          />
        )}
      </SidebarInset>
    </SidebarProvider>
  )
}
