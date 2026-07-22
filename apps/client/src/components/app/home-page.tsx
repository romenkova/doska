import { Home } from "@/components"
import { useActiveDashboard } from "@/lib/hooks"
import { AppShell } from "./app-shell"

const NO_DECK = { id: "", prefix: "" }

/** The landing screen, with no board open. */
export function HomePage() {
  const { dashboards, lastBoard, selectDashboard, createAndOpenDashboard } =
    useActiveDashboard()

  return (
    <AppShell
      deck={NO_DECK}
      dashboards={dashboards}
      activeDashboardId=""
      isDigestActive={false}
      onSelectDashboard={(d) => selectDashboard(d.id)}
      onCreateDashboard={createAndOpenDashboard}
    >
      <Home
        hasBoards={dashboards.length > 0}
        lastBoard={lastBoard}
        onContinue={() => lastBoard && selectDashboard(lastBoard.id)}
        onCreateDashboard={createAndOpenDashboard}
      />
    </AppShell>
  )
}
