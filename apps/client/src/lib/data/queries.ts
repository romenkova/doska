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

// These read IndexedDB, so they must resolve offline (see query-client.ts).
export function useDashboards() {
  return useQuery({
    queryKey: keys.dashboards,
    queryFn: () => api.getDashboards(),
    networkMode: "always",
  })
}

export function useBoard(deckId: string) {
  return useQuery({
    queryKey: keys.board(deckId),
    queryFn: () => api.getBoard(deckId),
    networkMode: "always",
  })
}

export function useCard(id: string | null) {
  return useQuery({
    queryKey: keys.card(id ?? ""),
    queryFn: () => api.getCard(id as string),
    enabled: id != null,
    networkMode: "always",
  })
}
