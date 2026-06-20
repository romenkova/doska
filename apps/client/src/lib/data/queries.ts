import { useQuery } from "@tanstack/react-query"
import { fetchSession } from "@/lib/api/auth"
import * as api from "@/lib/api/operations"
import { keys } from "./keys"

/**
 * The sync session. `data` is `undefined` until the first check resolves; auth
 * only gates sync, so this never blocks the app — it just drives the sign-in UI.
 */
export function useSession() {
  return useQuery({ queryKey: keys.session, queryFn: fetchSession })
}

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
