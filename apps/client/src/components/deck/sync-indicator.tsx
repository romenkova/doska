import type { SyncState } from "@deck/sync"
import { Button, cn } from "@deck/ui-kit"
import { Check, LoaderCircle, PencilLine, TriangleAlert } from "lucide-react"
import { sync } from "@/lib/api/sync"
import { useSyncStatus } from "@/lib/hooks/use-sync-status"

/** Resolves the live sync state into the icon, label, and tint to render. */
function view({ status, pending }: SyncState) {
  if (status === "syncing")
    return {
      Icon: LoaderCircle,
      label: "Saving...",
      spin: true,
      className: "text-muted-foreground",
    }
  if (status === "error")
    return {
      Icon: TriangleAlert,
      label: "Sync failed",
      spin: false,
      className: "text-destructive",
    }
  if (pending > 0)
    return {
      Icon: PencilLine,
      label: `${pending} unsaved ${pending === 1 ? "change" : "changes"}`,
      spin: false,
      className: "text-muted-foreground",
    }
  return {
    Icon: Check,
    label: "All changes saved",
    spin: false,
    className: "text-muted-foreground",
  }
}

/**
 * The board's sync status: a spinner while reconciling, an unsaved-changes
 * badge, a saved check, or a retry-on-click error. Clicking flushes a sync now,
 * mirroring ⌘S.
 */
export function SyncIndicator() {
  const state = useSyncStatus()
  const { Icon, label, spin, className } = view(state)

  return (
    <Button
      variant="ghost"
      aria-label={label}
      title={label}
      onClick={() => void sync.reconcile()}
      className={cn("text-muted-foreground", className)}
    >
      <span>{label}</span>
      <Icon className={cn(spin && "animate-spin")} />
    </Button>
  )
}
