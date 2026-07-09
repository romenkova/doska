import { Button } from "@doska/ui-kit"
import { Download, X } from "lucide-react"
import { useState } from "react"
import { useUpdateState } from "@/lib/update-store"

/**
 * Shows a dismissible notice with an Install button when a matching update is
 * available (manual mode). On desktop that's a Tauri updater bundle; on web,
 * a service worker holding a newer build. Renders nothing when auto-update
 * already handled the install. Reads the shared check via `useUpdateState`.
 */
export function UpdateBanner() {
  const state = useUpdateState()
  const [installing, setInstalling] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  if (state.status !== "available" || dismissed) return null

  const desktop = state.kind === "desktop"

  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-lg border bg-popover px-4 py-2 text-sm text-popover-foreground shadow-xl">
      <span>
        {desktop
          ? `Update to v${state.version} available`
          : "A new version is available"}
      </span>
      <Button
        size="sm"
        disabled={installing}
        onClick={() => {
          setInstalling(true)
          void state.install().catch(() => setInstalling(false))
        }}
      >
        <Download className="size-4" />
        {desktop
          ? installing
            ? "Installing…"
            : "Install"
          : installing
            ? "Reloading…"
            : "Reload"}
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Dismiss"
        onClick={() => setDismissed(true)}
      >
        <X />
      </Button>
    </div>
  )
}
