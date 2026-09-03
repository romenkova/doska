import { useEffect } from "react"
import { generateKeyBetween } from "fractional-indexing"
import { useLocation } from "wouter"
import { sync } from "@doska/core/sync"
import { setLastBoard, useLastBoard } from "@doska/core/last-board"
import { useDashboards } from "@doska/core/queries"
import { useDashboardNav } from "@/lib/hooks/use-dashboard-nav"
import type { Dashboard } from "@doska/core/types"

/**
 * Resolves the dashboard for the open route: the list, the active board (or a
 * blank placeholder while one loads), and the navigation/sync side effects that
 * keep the URL, the redirect-on-missing, and background sync in step with it.
 */
export function useActiveDashboard(deckId?: string) {
  const [, navigate] = useLocation()
  const { data: dashboards = [], isPending: dashboardsLoading } =
    useDashboards()
  const { selectDashboard, createAndOpenDashboard } = useDashboardNav()

  const active = dashboards.find((d) => d.id === deckId)
  const dashboard: Dashboard = active ?? {
    id: deckId ?? "",
    title: "",
    position: generateKeyBetween(null, null),
    sort: [],
    deletedAt: null,
    updatedAt: 0,
  }

  // The board open most recently, surfaced on Home as a "continue editing"
  // shortcut. The open board wins over the remembered one, which is still the
  // previous board until the effect below records this one.
  const remembered = useLastBoard()
  const lastBoardId = deckId ?? remembered

  // Resolved against the live list so a deleted board never lingers.
  const lastBoard = lastBoardId
    ? (dashboards.find((d) => d.id === lastBoardId) ?? null)
    : null

  // The requested board doesn't exist (once the list has loaded) — go home.
  useEffect(() => {
    if (dashboardsLoading || !deckId || active) return
    navigate("~/")
  }, [dashboardsLoading, deckId, active, navigate])

  // Remember the open board so Home can offer to reopen it.
  useEffect(() => {
    if (deckId) setLastBoard(deckId)
  }, [deckId])

  // Point background sync at the open board (and reconcile on switch).
  useEffect(() => {
    sync.setActiveBoard(deckId ?? null)
  }, [deckId])

  return {
    dashboards,
    dashboardsLoading,
    dashboard,
    lastBoard,
    selectDashboard,
    createAndOpenDashboard,
  }
}
