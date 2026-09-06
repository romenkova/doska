import type { DigestFilter } from "../api/operations"

export const keys = {
  dashboards: ["dashboards"] as const,
  /** Under the dashboards prefix: whatever refreshes the list refreshes the tree. */
  sidebar: ["dashboards", "sidebar"] as const,
  /** The bare key is the invalidation prefix for every board. */
  boards: ["board"] as const,
  board: (deckId: string) => ["board", deckId] as const,
  /** The bare key is the invalidation prefix for every card. */
  cards: ["card"] as const,
  card: (id: string) => ["card", id] as const,
  trash: ["trash"] as const,
  /** The bare key is the invalidation prefix for every filter's digest. */
  digest: ["digest"] as const,
  digestFilter: (filter: DigestFilter) => ["digest", filter] as const,
  cardDeck: (id: string) => ["card-deck", id] as const,
  /** The bare key is the invalidation prefix for every card's column. */
  cardCols: ["card-col"] as const,
  cardCol: (id: string) => ["card-col", id] as const,
  session: ["session"] as const,
  sso: ["sso"] as const,
  /** Per account: signing out and back in as someone else must not show the
   * previous person's connections. */
  linkedProviders: (userId: string) =>
    ["session", "linked-providers", userId] as const,
  accounts: ["accounts"] as const,
  /** Under the accounts prefix, so deleting an account clears its own count. */
  ownedBoards: (userId: string) =>
    ["accounts", "owned-boards", userId] as const,
  members: (boardId: string) => ["members", boardId] as const,
  /** The board's public share link. Not under `board`, which is the local
   * record: this one only ever comes from the server. */
  publicStatus: (boardId: string) => ["public-status", boardId] as const,
  /** A published board's snapshot, addressed by share token — the visitor has no
   * board id, and never learns one that would collide with the local keys. */
  publicBoard: (token: string) => ["public-board", token] as const,
  publishedBoards: ["public-status", "published"] as const,
  sharedBoards: ["dashboards", "shared"] as const,
  directory: ["directory"] as const,
  unclaimedLocalBoards: ["unclaimed-local-boards"] as const,
  /** Both sit under the board key, so a board invalidation refreshes them. */
  cardRefOptions: (deckId: string) => ["board", deckId, "ref-options"] as const,
  cardRef: (deckId: string, displayId: string) =>
    ["board", deckId, "ref", displayId] as const,
}

/**
 * What a write to one card's content goes stale in
 */
export const cardWriteKeys = (id: string) =>
  [keys.card(id), keys.digest, keys.boards] as const
