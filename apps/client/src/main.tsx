import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "@/components/theme-provider.tsx"
import { seed } from "@/lib/api/db"
import { startBackgroundSync } from "@/lib/api/sync"
import { queryClient } from "@/lib/query-client"
import { Router } from "./router.tsx"
import "./index.css"

// Local-first: mutations persist to IndexedDB instantly; this reconciles the open
// board with the server every 10s in the background (and on tab focus).
startBackgroundSync()

// Seed the local DB from fixtures on first run, before the first render reads it.
await seed()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Router />
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>
)
