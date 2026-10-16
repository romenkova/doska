import { Button, Toast } from "@doska/ui-kit"
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
    <Toast visible={visible} className="max-w-md gap-3">
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
    </Toast>
  )
}
