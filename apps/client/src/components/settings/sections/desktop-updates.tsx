import { Button, Checkbox } from "@doska/ui-kit"
import { useState, useSyncExternalStore } from "react"
import {
  getAutoUpdate,
  isDesktop,
  setAutoUpdate,
  subscribeAutoUpdate,
} from "@/lib/api/runtime"
import { checkForUpdates, type UpdateState } from "@/lib/updates"

type CheckState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "none" }
  | { status: "installing" }
  | { status: "available"; version: string; install: () => Promise<void> }

export function DesktopUpdatesSection() {
  const desktop = isDesktop()
  const auto = useSyncExternalStore(subscribeAutoUpdate, getAutoUpdate)
  const [check, setCheck] = useState<CheckState>({ status: "idle" })

  async function runCheck() {
    setCheck({ status: "checking" })
    const result: UpdateState = await checkForUpdates()
    if (result.status === "available") {
      setCheck({
        status: "available",
        version: result.version,
        install: result.install,
      })
    } else {
      setCheck({ status: "none" })
    }
  }

  if (!desktop) return null

  return (
    <div className="flex flex-col gap-3">
      <label className="flex items-start gap-2">
        <Checkbox
          className="mt-0.5"
          checked={auto}
          onCheckedChange={setAutoUpdate}
        />
        <span className="flex flex-col gap-1">
          <span className="text-sm font-medium">Automatic updates</span>
          <span className="text-xs text-muted-foreground">
            Install matching updates on launch without asking.
          </span>
        </span>
      </label>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={
            check.status === "checking" || check.status === "installing"
          }
          onClick={() => void runCheck()}
        >
          {check.status === "checking" ? "Checking…" : "Check for updates"}
        </Button>
        {check.status === "none" && (
          <span className="text-xs text-muted-foreground">
            You're up to date.
          </span>
        )}
        {check.status === "available" && (
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setCheck({ status: "installing" })
              void check.install().catch(() => setCheck({ status: "idle" }))
            }}
          >
            Install v{check.version}
          </Button>
        )}
        {check.status === "installing" && (
          <span className="text-xs text-muted-foreground">Installing…</span>
        )}
      </div>
    </div>
  )
}
