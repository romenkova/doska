import { Button, Checkbox } from "@doska/ui-kit"
import { useState, useSyncExternalStore } from "react"
import {
  getAutoUpdate,
  setAutoUpdate,
  subscribeAutoUpdate,
} from "@/lib/auto-update"
import { isDesktop } from "@/lib/platform"
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
  const desktop = isDesktop()
  const version = useAppVersion()
  const update = useUpdateState()
  const auto = useSyncExternalStore(subscribeAutoUpdate, getAutoUpdate)
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
      {desktop && (
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
      )}
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
