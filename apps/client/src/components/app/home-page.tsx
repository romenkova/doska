import { useMemo } from "react"
import { useRoute } from "wouter"
import { Home } from "@/components"
import { DigestView } from "@/components/digest/digest-view"
import { useCardDeckId, useDigest } from "@doska/core/queries"
import { useActiveDashboard } from "@/lib/hooks"
import { routes } from "@/lib/routes"
import { AppShell } from "./app-shell"

export function HomePage() {
  const {
    dashboards,
    dashboardsLoading,
    lastBoard,
    selectDashboard,
    createAndOpenDashboard,
  } = useActiveDashboard()
  const { data: entries = [], isPending } = useDigest("week")

  const [, params] = useRoute(routes.card.pattern)
  const { data: cardDeckId } = useCardDeckId(params?.id ?? null)

  const deck = useMemo(() => ({ id: cardDeckId ?? "", sort: [] }), [cardDeckId])

  const loading = isPending || dashboardsLoading

  return (
    <AppShell deck={deck} cardCloseHref={`~${routes.home()}`}>
      {loading ? null : entries.length === 0 ? (
        <Home
          hasBoards={dashboards.length > 0}
          lastBoard={lastBoard}
          onContinue={() => lastBoard && selectDashboard(lastBoard.id)}
          onCreateDashboard={createAndOpenDashboard}
        />
      ) : (
        <DigestView />
      )}
    </AppShell>
  )
}
