import type { DigestFilter } from "@/lib/api/operations"

export const keys = {
  dashboards: ["dashboards"] as const,
  board: (deckId: string) => ["board", deckId] as const,
  card: (id: string) => ["card", id] as const,
  /** The bare key is the invalidation prefix for every filter's digest. */
  digest: ["digest"] as const,
  digestFilter: (filter: DigestFilter) => ["digest", filter] as const,
  cardDeck: (id: string) => ["card-deck", id] as const,
  session: ["session"] as const,
}
