/** Path builders and route patterns for the app's wouter routes. */
export const routes = {
  about: () => "/about",
  /** Also the server's OAuth login page — see `SignInPage`. */
  signIn: () => "/sign-in",
  /** Deadlined cards from every board. Nested like a deck, so it can host the
   * card panel on the same `routes.card` pattern. */
  digest: () => "/digest",
  /** Deleted boards, columns and cards, restorable until they age out. */
  trash: () => "/trash",
  /** Top-level deck route — one per dashboard. */
  deck: {
    pattern: "/d/:id",
    to: (id: string) => `/d/${id}`,
  },
  /**
   * A published board, open to anyone with the link. Nested like a deck, so it
   * can host the card panel on the same `routes.card` pattern.
   */
  public: {
    pattern: "/p/:token",
    to: (token: string) => `/p/${token}`,
    /** Decided before React mounts, to pick which application to start. */
    matches: (path: string) => path.startsWith("/p/"),
  },
  /**
   * Card panel. It is rendered inside the active deck's nested router, so its
   * pattern and paths are relative to that deck (full URL: /d/:deckId/c/:id).
   */
  card: {
    pattern: "/c/:id",
    to: (id: string) => `/c/${id}`,
  },
} as const
