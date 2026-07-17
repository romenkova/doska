import { useEffect, useState } from "react"
import { generateKeyBetween } from "fractional-indexing"
import { useLocation } from "wouter"
import { sync } from "@/lib/api/sync"
import { useCreateDashboard } from "@/lib/data/mutations"
import { useDashboards } from "@/lib/data/queries"
import { routes } from "@/lib/routes"
import type { Dashboard } from "@/lib/types"

/** localStorage key holding the id of the board that was open most recently. */
const LAST_BOARD_KEY = "doska:last-board"

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
    prefix: "",
    deletedAt: null,
    updatedAt: 0,
  }

  // The board open most recently, surfaced on Home as a "continue editing"
  // shortcut. Seeded from storage, then tracked in state — storage is the
  // cross-session copy, not something to re-read every render.
  const [lastBoardId, setLastBoardId] = useState(
    () => deckId ?? localStorage.getItem(LAST_BOARD_KEY)
  )
  if (deckId && deckId !== lastBoardId) setLastBoardId(deckId)

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
    if (deckId) localStorage.setItem(LAST_BOARD_KEY, deckId)
  }, [deckId])

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

  return {
    dashboards,
    dashboard,
    lastBoard,
    selectDashboard,
    createAndOpenDashboard,
  }
}
