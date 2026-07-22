import { useQuery } from "@tanstack/react-query"
import { fetchSession } from "@/lib/api/auth"
import * as api from "@/lib/api/operations"
import type { DigestFilter } from "@/lib/api/operations"
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

/** Deadlined cards across every board, for the digest. */
export function useDigest(filter: DigestFilter) {
  return useQuery({
    queryKey: keys.digestFilter(filter),
    queryFn: () => api.getDigest(filter),
    networkMode: "always",
  })
}

/** The board an arbitrary card belongs to — see {@link api.getCardDeck}. */
export function useCardDeck(id: string | null) {
  return useQuery({
    queryKey: keys.cardDeck(id ?? ""),
    queryFn: () => api.getCardDeck(id as string),
    enabled: id != null,
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
