import { useQuery } from "@tanstack/react-query"
import { countOwnedBoards, listAccounts } from "../api/accounts"
import { publicBoardToken, publishedBoards } from "../api/boards"
import { fetchSession } from "../api/auth"
import { fetchLinkedProviders, fetchSsoProviders } from "../api/sso"
import { fetchPublicBoard } from "../api/public"
import { listDirectory, listMembers, listSharedBoards } from "../api/members"
import {
  hasUnclaimedLocalBoards,
  UNCLAIMED_BOARDS_WARNING,
} from "../api/identity"
import * as api from "../api/operations"
import type { DigestFilter } from "../api/operations"
import { keys } from "./keys"

export type { Account } from "../api/accounts"
export type { SsoProvider } from "../api/sso"
export { UNCLAIMED_BOARDS_WARNING }

/** Identity providers offered at sign-in. Empty without a server, or SSO. */
export function useSsoProviders() {
  return useQuery({
    queryKey: keys.sso,
    queryFn: fetchSsoProviders,
    networkMode: "always",
  })
}

export function useLinkedProviders(userId: string | null) {
  return useQuery({
    queryKey: keys.linkedProviders(userId ?? ""),
    queryFn: fetchLinkedProviders,
    enabled: userId !== null,
  })
}

/**
 * The sync session. `data` is `undefined` until the first check resolves; auth
 * only gates sync, so this never blocks the app — it just drives the sign-in UI.
 */
export function useSession() {
  return useQuery({
    queryKey: keys.session,
    queryFn: fetchSession,
    networkMode: "always",
  })
}

/** Whether the sign-in form should warn that the boards on this device are
 * about to become part of whichever account signs in*/
export function useUnclaimedLocalBoards() {
  return useQuery({
    queryKey: keys.unclaimedLocalBoards,
    queryFn: hasUnclaimedLocalBoards,
    networkMode: "always",
  })
}

/** Every account on the server. Admin-only server-side, so `enabled` is how the
 * caller keeps a non-admin session from firing a request that would 403. */
export function useAccounts(enabled: boolean) {
  return useQuery({
    queryKey: keys.accounts,
    queryFn: listAccounts,
    enabled,
  })
}

/** What stands between one account and being deleted. */
export function useOwnedBoards(userId: string, enabled: boolean) {
  return useQuery({
    queryKey: keys.ownedBoards(userId),
    queryFn: () => countOwnedBoards(userId),
    enabled,
  })
}

/** Who a board is shared with, and what the reader may change about it.
 * Board-scoped server-side, so `enabled` keeps a signed-out session quiet. */
export function useBoardMembers(boardId: string, enabled: boolean) {
  return useQuery({
    queryKey: keys.members(boardId),
    queryFn: () => listMembers(boardId),
    enabled,
  })
}

/** The board's public link, or null while it has none. Readable by anyone on the
 * board; `enabled` keeps a signed-out client from asking at all. */
export function usePublicBoardStatus(boardId: string, enabled: boolean) {
  return useQuery({
    queryKey: keys.publicStatus(boardId),
    queryFn: () => publicBoardToken(boardId),
    enabled,
  })
}

/**
 * A published board, fetched whole from its share link. No retry: the one
 * expected failure is a token that is not published, and retrying that just
 * makes the visitor wait for the same answer.
 */
export function usePublicBoard(token: string) {
  return useQuery({
    queryKey: keys.publicBoard(token),
    queryFn: () => fetchPublicBoard(token),
    retry: false,
    staleTime: Infinity,
  })
}

/** Which boards are published, for the sidebar's marker. */
export function usePublishedBoards(enabled: boolean) {
  return useQuery({
    queryKey: keys.publishedBoards,
    queryFn: publishedBoards,
    enabled,
  })
}

/** Which boards are shared, for the sidebar's marker. */
export function useSharedBoards(enabled: boolean) {
  return useQuery({
    queryKey: keys.sharedBoards,
    queryFn: listSharedBoards,
    enabled,
  })
}

/** Every active account, for the member picker. Any session may read it. */
export function useDirectory(enabled: boolean) {
  return useQuery({
    queryKey: keys.directory,
    queryFn: listDirectory,
    enabled,
  })
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

/** Everything deleted and still restorable — see {@link api.getTrash}. */
export function useTrash() {
  return useQuery({
    queryKey: keys.trash,
    queryFn: () => api.getTrash(),
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

/** The board an arbitrary card belongs to — see {@link api.getCardDeckId}. */
export function useCardDeckId(id: string | null) {
  return useQuery({
    queryKey: keys.cardDeck(id ?? ""),
    queryFn: () => api.getCardDeckId(id as string),
    enabled: id != null,
    networkMode: "always",
  })
}

/** The column an arbitrary card lives in — see {@link api.getCardCol}. */
export function useCardCol(id: string | null) {
  return useQuery({
    queryKey: keys.cardCol(id ?? ""),
    queryFn: () => api.getCardCol(id as string),
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
