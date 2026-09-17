import { Button, cn, Toast } from "@doska/ui-kit"
import { Download } from "lucide-react"
import type { UpdateState } from "@/lib/updates"

type ShownUpdate = Exclude<UpdateState, { status: "none" }>

interface IProps {
  state: ShownUpdate
  installing: boolean
  visible: boolean
  onInstall: () => void
}

function message(state: ShownUpdate) {
  if (state.status === "mismatch") {
    return `Your server runs v${state.version}. Use the matching app version.`
  }
  if (state.kind === "desktop") return `Update to v${state.version} available`
  return "An update is available"
}

export function UpdateToastContent({
  state,
  installing,
  visible,
  onInstall,
}: IProps) {
  const web = state.status === "available" && state.kind === "web"

  return (
    <Toast visible={visible}>
      <div
        role="status"
        aria-live="polite"
        className={cn(
          "flex max-w-md items-center gap-3 rounded-lg",
          "border bg-popover px-4 py-2 text-sm text-popover-foreground"
        )}
      >
        <span className="min-w-0">{message(state)}</span>
        <Button
          size="sm"
          className="shrink-0"
          disabled={installing}
          onClick={onInstall}
        >
          <Download className="size-4" />
          {web
            ? installing
              ? "Loading…"
              : "Reload"
            : installing
              ? "Installing…"
              : "Install"}
        </Button>
      </div>
    </Toast>
  )
}
