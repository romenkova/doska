import { useRoute } from "wouter"
import { getCardView } from "@/lib/card-view"
import { routes } from "@/lib/routes"

export function useIsPanelOpen(): boolean {
  const [isCardRoute] = useRoute(routes.card.pattern)
  const [isArchiveRoute] = useRoute(routes.archived())
  return (isCardRoute || isArchiveRoute) && getCardView() === "panel"
}
