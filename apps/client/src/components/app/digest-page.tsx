import { useMemo } from "react"
import { useRoute } from "wouter"
import { DigestView } from "@/components/digest/digest-view"
import { useCardDeck } from "@/lib/data/queries"
import { useActiveDashboard } from "@/lib/hooks"
import { routes } from "@/lib/routes"
import { AppShell } from "./app-shell"

/** Deadlined cards from every board, at `/digest`. */
export function DigestPage() {
  const { dashboards, selectDashboard, createAndOpenDashboard } =
    useActiveDashboard()

  // The digest's cards come from any board, so the panel's deck is resolved
  // from the open card rather than from the route.
  const [, params] = useRoute(routes.card.pattern)
  const { data: cardDeck } = useCardDeck(params?.id ?? null)

  const deck = useMemo(
    () => ({ id: cardDeck?.id ?? "", prefix: cardDeck?.prefix ?? "" }),
    [cardDeck]
  )

  return (
    <AppShell
      deck={deck}
      dashboards={dashboards}
      activeDashboardId=""
      isDigestActive
      onSelectDashboard={(d) => selectDashboard(d.id)}
      onCreateDashboard={createAndOpenDashboard}
      cardCloseHref={`~${routes.digest()}`}
    >
      <DigestView />
    </AppShell>
  )
}
