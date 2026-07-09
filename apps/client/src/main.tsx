import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { QueryClientProvider } from "@tanstack/react-query"
import { LoginPromptProvider } from "@/components/login/login-prompt"
import { ThemeProvider } from "@/components/theme-provider.tsx"
import { seed } from "@/lib/api/db/db.ts"
import { keys } from "@/lib/data/keys"
import { requestPersistentStorage } from "@/lib/persist"
import { queryClient } from "@/lib/query-client"
import { Router } from "./router.tsx"
import { startBackgroundSync } from "./lib/api/sync"
import { UpdateBanner } from "@/components/updates/update-banner"
import { WindowDragRegion } from "@/components/window-drag-region"
import "./index.css"

// Dispatched by the oRPC fetch wrapper.
window.addEventListener("auth:expired", () => {
  queryClient.setQueryData(keys.session, { authed: false, login: null })
})

startBackgroundSync()

// Not awaited: the answer only affects eviction policy, never this render.
void requestPersistentStorage()

// Seed the local DB from fixtures on first run
await seed()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LoginPromptProvider>
          <Router />
          <UpdateBanner />
          <WindowDragRegion />
        </LoginPromptProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>
)
