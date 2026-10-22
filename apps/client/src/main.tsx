import "@/lib/adapters/install" // must stay first
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { QueryClientProvider } from "@tanstack/react-query"
import { MotionConfig } from "motion/react"
import { Toaster } from "react-hot-toast"
import { LoginPromptProvider } from "@/providers/login-prompt/login-prompt-provider"
import { ThemeProvider } from "@/providers/theme/theme-provider"
import { isDesktop } from "@/lib/platform"
import { bootstrapClient, queryClient } from "@doska/core"
import { trackAppHeight } from "@/lib/app-height"
import { blockEdgeSwipeNavigation } from "@/lib/edge-swipe"
import { initErrorReporting } from "@/lib/error-reporting"
import { initExternalLinks } from "@/lib/external-links"
import { initFullscreen } from "@/lib/fullscreen"
import { initZoom } from "@/lib/zoom"
import { requestPersistentStorage } from "@/lib/persist"
import { routes } from "@/lib/routes"
import { Router } from "./router.tsx"
import { ErrorBoundary } from "@/components/error-boundary"
import { PublicRouter } from "@/components/public/public-router"
import { UpdateToast } from "@/components/toasts/update/update-toast"
import { OfflineToast } from "@/components/toasts/offline/offline-toast"
import { WhatsNewToast } from "@/components/toasts/whats-new/whats-new-toast"
import { OnboardingModal } from "@/components/onboarding/onboarding-modal"
import { persistOnboardingSkip } from "@/components/onboarding/use-should-onboard"
import { UndoToaster } from "@/components/toasts/card-delete/undo-toaster"
import { WindowDragRegion } from "@/components/window-drag-region"
import { WindowControlsFlag } from "@/components/window-controls-flag"
import { WindowSyncListener } from "@/components/card-window/window-sync-listener"
import { DevMenu } from "@/components/dev-menu/dev-menu"
import "./index.css"

const root = createRoot(document.getElementById("root")!)

const isPublicLink = routes.public.matches(window.location.pathname)

trackAppHeight()

initErrorReporting()

persistOnboardingSkip()

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
  try {
    await bootstrapClient(Number(import.meta.env.VITE_SYNC_INTERVAL_MS))
  } catch (error) {
    console.error("Bootstrap failed", error)
    root.render(
      <StrictMode>
        <ErrorBoundary
          error={error instanceof Error ? error : new Error(String(error))}
        >
          {null}
        </ErrorBoundary>
      </StrictMode>
    )
    throw error
  }

  blockEdgeSwipeNavigation()

  initZoom()

  initFullscreen()

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
              <WhatsNewToast />
              <OnboardingModal />
              <WindowDragRegion />
              <WindowControlsFlag />
              <WindowSyncListener />
              {import.meta.env.DEV && <DevMenu />}
            </LoginPromptProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </StrictMode>
  )
}
