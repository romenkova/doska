import type { SyncState } from "@doska/sync"
import { Button, cn } from "@doska/ui-kit"
import {
  Check,
  CloudOff,
  LoaderCircle,
  LogIn,
  PencilLine,
  TriangleAlert,
} from "lucide-react"
import { useLoginPrompt } from "@/components/login/login-prompt-context"
import { sync, useConnection, type Connection } from "@/lib/api/sync"
import { useAuth, useSyncStatus } from "@/lib/hooks"

/** Resolves the live sync state into the icon, label, and tint to render. */
function view({ status, pending }: SyncState, connection: Connection) {
  if (connection.status === "dropped")
    return connection.reason === "offline"
      ? {
          Icon: CloudOff,
          label: "Offline",
          spin: false,
          className: "text-destructive",
        }
      : {
          Icon: TriangleAlert,
          label: "Sync failed",
          spin: false,
          className: "text-destructive",
        }

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
 * badge, a saved check, an offline notice, or a retry-on-click error. Clicking
 * flushes a sync now, mirroring ⌘S.
 *
 * Board-only, so it can't be the whole story — {@link ConnectionBanner} covers
 * the rest of the app.
 */
export function SyncIndicator() {
  const state = useSyncStatus()
  const connection = useConnection()
  const { authed } = useAuth()
  const openLogin = useLoginPrompt()

  // Signed out, sync can't run — point the user at the login prompt instead of
  // showing a misleading "sync failed". (`authed === null` is the pre-check
  // state; treat it as signed-in to avoid a flash.)
  if (authed === false) {
    return (
      <Button
        variant="secondary"
        aria-label="Sign in to sync"
        title="Sign in to sync"
        onClick={openLogin}
        className="text-muted-foreground"
      >
        <span>Sign in to sync</span>
        <LogIn />
      </Button>
    )
  }

  const { Icon, label, spin, className } = view(state, connection)

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
