import { Button } from "@doska/ui-kit"
import { CircleHelp } from "lucide-react"
import { useState } from "react"
import { CardHelpModal } from "./card-help-modal"

export const CARD_SHORTCUTS_SEEN_KEY = "doska:card-shortcuts-seen"

function readSeen(): boolean {
  try {
    return localStorage.getItem(CARD_SHORTCUTS_SEEN_KEY) === "true"
  } catch {
    return false
  }
}

export function CardHelpButton() {
  const [open, setOpen] = useState(false)
  const [seen, setSeen] = useState(readSeen)

  function openHelp() {
    setOpen(true)
    if (seen) return
    try {
      localStorage.setItem(CARD_SHORTCUTS_SEEN_KEY, "true")
    } catch {
      // LS is not available, just show the label
    }
    setSeen(true)
  }

  return (
    <>
      <Button
        variant="ghost"
        size={seen ? "icon-sm" : "sm"}
        aria-label="Shortcuts"
        className="text-muted-foreground"
        onClick={openHelp}
      >
        <CircleHelp />
        {!seen && "Shortcuts"}
      </Button>
      <CardHelpModal open={open} onOpenChange={setOpen} />
    </>
  )
}
