import { useQuery } from "@tanstack/react-query"
import * as api from "@/lib/api/operations"
import { keys } from "./keys"

export function useDashboards() {
  return useQuery({
    queryKey: keys.dashboards,
    queryFn: () => api.getDashboards(),
  })
}

export function useBoard(deckId: string) {
  return useQuery({
    queryKey: keys.board(deckId),
    queryFn: () => api.getBoard(deckId),
  })
}

export function useCard(id: string) {
  return useQuery({
    queryKey: keys.card(id),
    queryFn: () => api.getCard(id),
  })
}
