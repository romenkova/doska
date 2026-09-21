import { Button } from "@doska/ui-kit"
import { useState } from "react"
import { runUpdateCheck, useUpdateState } from "@/lib/update-store"
import { useAppVersion } from "@/lib/version"
import { SettingsSection } from "../section"

const CheckState = {
  idle: "idle",
  checking: "checking",
  checked: "checked",
  installing: "installing",
} as const

type CheckState = (typeof CheckState)[keyof typeof CheckState]

/**
 * Manual update check for both platforms: a Tauri updater bundle on desktop,
 * a waiting service worker in the PWA.
 */
export function UpdatesSection() {
  const version = useAppVersion()
  const update = useUpdateState()
  const [check, setCheck] = useState<CheckState>(CheckState.idle)

  async function runCheck() {
    setCheck(CheckState.checking)
    await runUpdateCheck()
    setCheck(CheckState.checked)
  }

  return (
    <SettingsSection>
      <div className="text-sm">
        Doska version: <span className="text-muted-foreground">{version}</span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={
            check === CheckState.checking || check === CheckState.installing
          }
          onClick={() => void runCheck()}
        >
          {check === CheckState.checking ? "Checking…" : "Check for updates"}
        </Button>
        {check === CheckState.checked && update.status === "none" && (
          <span className="text-xs text-muted-foreground">
            You're up to date.
          </span>
        )}
        {update.status === "mismatch" && (
          <span className="text-xs text-muted-foreground">
            Your server runs v{update.version}. Use the matching app version.
          </span>
        )}
        {update.status !== "none" && (
          <Button
            type="button"
            size="sm"
            disabled={check === CheckState.installing}
            onClick={() => {
              setCheck(CheckState.installing)
              void update.install().catch(() => setCheck(CheckState.checked))
            }}
          >
            {update.status === "available" && update.kind === "web"
              ? "Reload to update"
              : `Install v${update.version}`}
          </Button>
        )}
        {check === CheckState.installing && (
          <span className="text-xs text-muted-foreground">
            {update.status === "available" && update.kind === "web"
              ? "Reloading…"
              : "Installing…"}
          </span>
        )}
      </div>
    </SettingsSection>
  )
}
