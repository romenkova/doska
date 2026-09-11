import "@/lib/adapters/install" // must stay first
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { QueryClientProvider } from "@tanstack/react-query"
import { MotionConfig } from "motion/react"
import { Toaster } from "react-hot-toast"
import { LoginPromptProvider } from "@/providers/login-prompt/login-prompt-provider"
import { ThemeProvider } from "@/providers/theme/theme-provider"
import { isDesktop } from "@/lib/platform"
import { bootstrapClient } from "@doska/core/bootstrap"
import { trackAppHeight } from "@/lib/app-height"
import { blockEdgeSwipeNavigation } from "@/lib/edge-swipe"
import { initExternalLinks } from "@/lib/external-links"
import { initZoom } from "@/lib/zoom"
import { requestPersistentStorage } from "@/lib/persist"
import { queryClient } from "@doska/core/query-client"
import { routes } from "@/lib/routes"
import { Router } from "./router.tsx"
import { ErrorBoundary } from "@/components/error-boundary"
import { PublicRouter } from "@/components/public/public-router"
import { UpdateToast } from "@/components/toasts/update/update-toast"
import { OfflineToast } from "@/components/toasts/offline/offline-toast"
import { UndoToaster } from "@/components/toasts/card-delete/undo-toaster"
import { WindowDragRegion } from "@/components/window-drag-region"
import { WindowSyncListener } from "@/components/card-window/window-sync-listener"
import "./index.css"

const root = createRoot(document.getElementById("root")!)

const isPublicLink = routes.public.matches(window.location.pathname)

trackAppHeight()

if (isPublicLink) {
  root.render(
    <StrictMode>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <PublicRouter />
          </ThemeProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </StrictMode>
  )
} else {
  await bootstrapClient(Number(import.meta.env.VITE_SYNC_INTERVAL_MS))

  blockEdgeSwipeNavigation()

  initZoom()

  initExternalLinks()

  if (!isDesktop()) void requestPersistentStorage()

  root.render(
    <StrictMode>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <LoginPromptProvider>
              <MotionConfig reducedMotion="user">
                <Router />
              </MotionConfig>
              <Toaster
                position="bottom-center"
                gutter={8}
                reverseOrder={false}
              />
              <UndoToaster />
              <UpdateToast />
              <OfflineToast />
              <WindowDragRegion />
              <WindowSyncListener />
            </LoginPromptProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </StrictMode>
  )
}
