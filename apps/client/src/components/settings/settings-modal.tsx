import {
  Button,
  Modal,
  ModalContent,
  ModalDescription,
  ModalTitle,
} from "@doska/ui-kit"
import { useState, useSyncExternalStore } from "react"
import {
  getAutoUpdate,
  isDesktop,
  setAutoUpdate,
  subscribeAutoUpdate,
} from "@/lib/api/runtime"
import { checkForUpdates, type UpdateState } from "@/lib/updates"

interface IProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type CheckState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "none" }
  | { status: "installing" }
  | { status: "available"; version: string; install: () => Promise<void> }

/**
 * App settings. Currently desktop update behaviour: opt-in automatic updates
 * plus a manual check. Updates are pinned to the sync server's version, so the
 * automatic toggle carries a self-hosting warning.
 */
export function SettingsModal({ open, onOpenChange }: IProps) {
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

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="md:max-w-sm">
        <div className="flex flex-col gap-4 p-6">
          <div className="flex flex-col gap-1">
            <ModalTitle>Settings</ModalTitle>
            {desktop ? (
              <ModalDescription>Manage desktop updates.</ModalDescription>
            ) : (
              <ModalDescription>
                Update settings are available in the desktop app.
              </ModalDescription>
            )}
          </div>

          {desktop && (
            <div className="flex flex-col gap-3">
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-0.5 size-4 accent-primary"
                  checked={auto}
                  onChange={(e) => setAutoUpdate(e.target.checked)}
                />
                <span className="flex flex-col gap-1">
                  <span className="text-sm font-medium">Automatic updates</span>
                  <span className="text-xs text-muted-foreground">
                    Install matching updates on launch without asking.
                  </span>
                </span>
              </label>

              {auto && (
                <p className="text-xs text-destructive">
                  Automatic updates may break a self-hosted setup — the app can
                  update ahead of your server.
                </p>
              )}

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
                  {check.status === "checking"
                    ? "Checking…"
                    : "Check for updates"}
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
                  <span className="text-xs text-muted-foreground">
                    Installing…
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  )
}
