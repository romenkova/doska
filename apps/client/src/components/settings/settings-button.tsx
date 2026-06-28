import { Button } from "@doska/ui-kit"
import { Settings } from "lucide-react"
import { useState } from "react"
import { SettingsModal } from "./settings-modal"

/** Sidebar entry that opens the settings modal. */
export function SettingsButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="justify-start gap-2"
        onClick={() => setOpen(true)}
      >
        <Settings className="size-4" />
        <span>Settings</span>
      </Button>
      <SettingsModal open={open} onOpenChange={setOpen} />
    </>
  )
}
