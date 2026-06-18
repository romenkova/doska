import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "@/components/theme-provider.tsx"
import { startBackgroundSync } from "@/lib/api/sync"
import { Router } from "./router.tsx"
import "./index.css"

const queryClient = new QueryClient()

// Local-first: mutations persist to IndexedDB instantly; this pushes them to the
// server every 30s in the background (stubbed until a real API exists).
startBackgroundSync()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Router />
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>
)
