import { useEffect } from "react"
import { generateKeyBetween } from "fractional-indexing"
import { useLocation } from "wouter"
import { sync } from "@/lib/api/sync"
import { useCreateDashboard } from "@/lib/data/mutations"
import { useDashboards } from "@/lib/data/queries"
import { routes } from "@/lib/routes"
import type { Dashboard } from "@/lib/types"

/**
 * Resolves the dashboard for the open route: the list, the active board (or a
 * blank placeholder while one loads), and the navigation/sync side effects that
 * keep the URL, the redirect-on-missing, and background sync in step with it.
 */
export function useActiveDashboard(deckId?: string) {
  const [, navigate] = useLocation()
  const { data: dashboards = [], isPending: dashboardsLoading } =
    useDashboards()
  const { mutate: createDashboard } = useCreateDashboard()

  const active = dashboards.find((d) => d.id === deckId)
  const dashboard: Dashboard = active ?? {
    id: deckId ?? "",
    title: "",
    position: generateKeyBetween(null, null),
    deletedAt: null,
    updatedAt: 0,
  }

  // The requested board doesn't exist (once the list has loaded) — go home.
  useEffect(() => {
    if (dashboardsLoading || !deckId || active) return
    navigate("~/")
  }, [dashboardsLoading, deckId, active, navigate])

  // Point background sync at the open board (and reconcile on switch).
  useEffect(() => {
    sync.setActiveBoard(deckId ?? null)
  }, [deckId])

  function selectDashboard(id: string) {
    navigate(`~${routes.deck.to(id)}`)
  }

  function createAndOpenDashboard() {
    createDashboard("Untitled board", {
      onSuccess: (created) => selectDashboard(created.id),
    })
  }

  return { dashboards, dashboard, selectDashboard, createAndOpenDashboard }
}
