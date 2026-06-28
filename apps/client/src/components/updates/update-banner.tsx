import { Button } from "@doska/ui-kit"
import { Download, X } from "lucide-react"
import { useState } from "react"
import { useUpdateState } from "@/lib/update-store"

/**
 * Shows a dismissible notice with an Install button when a matching update is
 * available (manual mode). Renders nothing on web or when auto-update already
 * handled the install. Reads the shared startup check via `useUpdateState`.
 */
export function UpdateBanner() {
  const state = useUpdateState()
  const [installing, setInstalling] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  if (state.status !== "available" || dismissed) return null

  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-lg border bg-popover px-4 py-2 text-sm text-popover-foreground shadow-xl">
      <span>Update to v{state.version} available</span>
      <Button
        size="sm"
        disabled={installing}
        onClick={() => {
          setInstalling(true)
          void state.install().catch(() => setInstalling(false))
        }}
      >
        <Download className="size-4" />
        {installing ? "Installing…" : "Install"}
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
