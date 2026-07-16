import { SidebarInset, SidebarProvider, cn } from "@doska/ui-kit"
import { useRoute } from "wouter"
import { AppSidebar, DeckView, Home } from "@/components"
import { CardPanel } from "@/components/card-panel/card-panel"
import { DeckPrefixProvider } from "@/components/deck/deck-context"
import { useActiveDashboard } from "@/lib/hooks"
import { routes } from "@/lib/routes"

export default function App({ deckId }: { deckId?: string }) {
  const {
    dashboards,
    dashboard,
    lastBoard,
    selectDashboard,
    createAndOpenDashboard,
  } = useActiveDashboard(deckId)

  const [isCardOpen] = useRoute(routes.card.pattern)

  return (
    <DeckPrefixProvider value={dashboard.prefix ?? ""}>
      <SidebarProvider className="h-svh">
        <AppSidebar
          dashboards={dashboards}
          activeDashboardId={dashboard.id}
          onSelectDashboard={(d) => selectDashboard(d.id)}
          onCreateDashboard={createAndOpenDashboard}
        />
        <SidebarInset
          className={cn(
            "min-w-0 overflow-hidden",
            // Hand the gutter to the panel, which needs to own it to centre its handle.
            "md:transition-[margin] md:duration-200 md:ease-linear",
            isCardOpen && "md:mr-0"
          )}
        >
          {deckId ? (
            <DeckView dashboard={dashboard} />
          ) : (
            <Home
              hasBoards={dashboards.length > 0}
              lastBoard={lastBoard}
              onContinue={() => lastBoard && selectDashboard(lastBoard.id)}
              onCreateDashboard={createAndOpenDashboard}
            />
          )}
        </SidebarInset>
        {deckId && <CardPanel closeHref={`~${routes.deck.to(dashboard.id)}`} />}
      </SidebarProvider>
    </DeckPrefixProvider>
  )
}
