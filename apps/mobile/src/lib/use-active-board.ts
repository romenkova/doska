import {
  type Dashboard,
  setLastBoard,
  useLastBoard,
  useDashboards,
} from "@doska/core"

/** Which board the screen is showing, remembered across launches. */
export function useActiveBoard(): {
  dashboards: Dashboard[]
  board: Dashboard | null
  deckId: string | null
  isPending: boolean
  select: (id: string) => void
} {
  const { data: dashboards = [], isPending } = useDashboards()
  const id = useLastBoard()

  // Resolved against the live list: a board deleted on another device must not
  // strand the screen on an id that no longer exists.
  const active =
    dashboards.find((dashboard) => dashboard.id === id) ?? dashboards[0] ?? null

  return {
    dashboards,
    board: active,
    deckId: active?.id ?? null,
    isPending,
    select: setLastBoard,
  }
}
