import { useMemo } from "react"
import { DeckView } from "@/components"
import { useActiveDashboard } from "@/lib/hooks"
import { routes } from "@/lib/routes"
import { AppShell } from "./app-shell"

/** One board, at `/d/:id`. */
export function BoardPage({ deckId }: { deckId: string }) {
  const { dashboards, dashboard, selectDashboard, createAndOpenDashboard } =
    useActiveDashboard(deckId)

  const deck = useMemo(
    () => ({ id: dashboard.id, prefix: dashboard.prefix ?? "" }),
    [dashboard.id, dashboard.prefix]
  )

  return (
    <AppShell
      deck={deck}
      dashboards={dashboards}
      activeDashboardId={dashboard.id}
      isDigestActive={false}
      onSelectDashboard={(d) => selectDashboard(d.id)}
      onCreateDashboard={createAndOpenDashboard}
      cardCloseHref={`~${routes.deck.to(dashboard.id)}`}
    >
      <DeckView dashboard={dashboard} />
    </AppShell>
  )
}
