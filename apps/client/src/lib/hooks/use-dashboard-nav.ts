import { useLocation } from "wouter"
import { useCreateDashboard } from "@/lib/data/mutations"
import { routes } from "@/lib/routes"

/** Open a board, or create one and open it. Side-effect free. */
export function useDashboardNav() {
  const [, navigate] = useLocation()
  const { mutate: createDashboard } = useCreateDashboard()

  function selectDashboard(id: string) {
    navigate(`~${routes.deck.to(id)}`)
  }

  function createAndOpenDashboard() {
    createDashboard("Untitled board", {
      onSuccess: (created) => selectDashboard(created.id),
    })
  }

  return { selectDashboard, createAndOpenDashboard }
}
