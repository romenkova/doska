/** Path builders and route patterns for the app's wouter routes. */
export const routes = {
  about: () => "/about",
  /** Also the server's OAuth login page — see `SignInPage`. */
  signIn: () => "/sign-in",
  /** Top-level deck route — one per dashboard. */
  deck: {
    pattern: "/d/:id",
    to: (id: string) => `/d/${id}`,
  },
  /**
   * Card modal. It is rendered inside the active deck's nested router, so its
   * pattern and paths are relative to that deck (full URL: /d/:deckId/c/:id).
   */
  card: {
    pattern: "/c/:id",
    to: (id: string) => `/c/${id}`,
  },
} as const
