import { useState } from "react"
import { Button, cn } from "@doska/ui-kit"
import { X } from "lucide-react"
import { sync, useConnection } from "@/lib/api/sync"

/**
 * The persistent "sync is down" notice, mounted app-wide — the board's sync pill
 * only exists inside a board, so without this a dropped sync is invisible from
 * Home or the sidebar. Clears itself the moment sync recovers.
 */
export function ConnectionBanner() {
  const connection = useConnection()
  const dropped = connection.status === "dropped"
  const [dismissed, setDismissed] = useState(false)

  // Reset the dismissal once sync recovers, so a fresh drop shows again.
  const [wasDropped, setWasDropped] = useState(dropped)
  if (wasDropped !== dropped) {
    setWasDropped(dropped)
    setDismissed(false)
  }

  if (!dropped || dismissed) return null

  return (
    <div className="fixed top-4 z-50 flex w-full justify-center px-2">
      <div
        role="status"
        aria-live="polite"
        className={cn(
          "flex max-w-md items-center gap-3 shadow-2xl",
          "rounded-lg border bg-popover px-4 py-2 text-sm text-popover-foreground"
        )}
      >
        <div className="min-w-0">
          <div className="font-medium">Not syncing</div>
          <div className="text-muted-foreground">
            Can not connect to server. You might be offline, or unauthenticated.
            Data is saved on this device.
          </div>
        </div>
        <Button
          size="sm"
          variant="secondary"
          className="shrink-0"
          onClick={sync.reconcile}
        >
          Retry
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="size-7 shrink-0"
          aria-label="Dismiss"
          onClick={() => setDismissed(true)}
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  )
}
