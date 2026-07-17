import { Button } from "@doska/ui-kit"
import { Settings } from "lucide-react"
import { modals, useModal } from "@/lib/hooks"

/** Sidebar entry that opens the settings modal (see `AppModals`). */
export function SettingsButton() {
  const { open } = useModal()

  return (
    <Button
      variant="ghost"
      size="sm"
      className="justify-start gap-2"
      onClick={() => open(modals.settings)}
    >
      <Settings className="size-4" />
      <span>Settings</span>
    </Button>
  )
}
