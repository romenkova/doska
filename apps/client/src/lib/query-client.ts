import { QueryClient } from "@tanstack/react-query"

/**
 * The app's single QueryClient. Lives here (rather than inline in `main.tsx`) so
 * non-React code — namely the background sync in `lib/api/sync.ts` — can
 * invalidate queries after applying changes pulled from the server.
 */
export const queryClient = new QueryClient()
