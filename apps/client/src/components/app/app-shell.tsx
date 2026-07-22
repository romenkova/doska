import { SidebarInset, SidebarProvider, cn } from "@doska/ui-kit"
import type { ReactNode } from "react"
import { useRoute } from "wouter"
import { AppSidebar } from "@/components"
import { CardPanel } from "@/components/card-panel/card-panel"
import { DeckProvider } from "@/components/deck/deck-context"
import { routes } from "@/lib/routes"
import type { Dashboard } from "@/lib/types"

interface IProps {
  /** The board cards in this screen belong to; empty outside one. */
  deck: { id: string; prefix: string }
  dashboards: Dashboard[]
  activeDashboardId: string
  isDigestActive: boolean
  onSelectDashboard: (dashboard: Dashboard) => void
  onCreateDashboard: () => void
  /** Where the card panel closes to. Omit on screens that can't open a card. */
  cardCloseHref?: string
  children: ReactNode
}

/**
 * The chrome every screen sits in: the sidebar, the screen itself, and the card
 * panel beside it. Each route supplies its own content and deck — the panel is
 * a sibling of the screen rather than a child, so the deck has to be provided
 * out here where both can read it.
 */
export function AppShell({
  deck,
  dashboards,
  activeDashboardId,
  isDigestActive,
  onSelectDashboard,
  onCreateDashboard,
  cardCloseHref,
  children,
}: IProps) {
  const [isCardOpen] = useRoute(routes.card.pattern)

  return (
    <DeckProvider value={deck}>
      <SidebarProvider className="h-svh">
        <AppSidebar
          dashboards={dashboards}
          activeDashboardId={activeDashboardId}
          isDigestActive={isDigestActive}
          onSelectDashboard={onSelectDashboard}
          onCreateDashboard={onCreateDashboard}
        />
        <SidebarInset
          className={cn(
            "min-w-0 overflow-hidden border border-border",
            // Hand the gutter to the panel, which needs to own it to centre its handle.
            "md:transition-[margin] md:duration-200 md:ease-linear",
            isCardOpen && "md:mr-0"
          )}
        >
          {children}
        </SidebarInset>
        {cardCloseHref && <CardPanel closeHref={cardCloseHref} />}
      </SidebarProvider>
    </DeckProvider>
  )
}
