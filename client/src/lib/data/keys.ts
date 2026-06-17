export const keys = {
  dashboards: ["dashboards"] as const,
  board: (deckId: string) => ["board", deckId] as const,
  card: (id: string) => ["card", id] as const,
}
