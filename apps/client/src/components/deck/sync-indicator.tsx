import type { SyncState } from "@doska/sync"
import { Button, cn } from "@doska/ui-kit"
import {
  Check,
  LoaderCircle,
  LogIn,
  PencilLine,
  TriangleAlert,
} from "lucide-react"
import { useSyncExternalStore } from "react"
import { useLoginPrompt } from "@/components/login/login-prompt-context"
import {
  getSyncTarget,
  isSyncConfigured,
  subscribeSyncConfig,
} from "@/lib/api/runtime"
import { sync } from "@/lib/api/sync"
import { useAuth, useSyncStatus } from "@/lib/hooks"

/** Resolves the live sync state into the icon, label, and tint to render. */
function view({ status, pending }: SyncState) {
  if (status === "syncing")
    return {
      Icon: LoaderCircle,
      label: "",
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
      label: `${pending} ${pending === 1 ? "change" : "changes"}`,
      spin: false,
      className: "text-muted-foreground",
    }
  return {
    Icon: Check,
    label: "Saved",
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
  const { authed } = useAuth()
  const openLogin = useLoginPrompt()
  const target = useSyncExternalStore(subscribeSyncConfig, getSyncTarget)
  const configured = useSyncExternalStore(subscribeSyncConfig, isSyncConfigured)

  // Sync can't run yet: the server backend needs an account, the folder backend
  // needs a folder. Point the user at the set-up dialog instead of showing a
  // misleading status. (`authed === null` is the pre-check state; treat it as
  // signed-in to avoid a flash.)
  const needsSetup =
    target === "server" ? authed === false : !configured
  if (needsSetup) {
    return (
      <Button
        variant="secondary"
        aria-label="Sync is not set up"
        title="Sync is not set up"
        onClick={openLogin}
        className="text-muted-foreground"
      >
        <span>Sync is not set up</span>
        <LogIn />
      </Button>
    )
  }

  const { Icon, label, spin, className } = view(state)

  return (
    <Button
      variant="secondary"
      aria-label={label}
      title={label}
      onClick={() => void sync.reconcile()}
      className={cn("text-muted-foreground", className)}
    >
      <Icon className={cn(spin && "animate-spin")} />
      <span>{label}</span>
    </Button>
  )
}
