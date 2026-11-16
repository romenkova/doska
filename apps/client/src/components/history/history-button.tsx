import { SidebarMenuButton, SidebarMenuItem } from "@doska/ui-kit"
import { History } from "lucide-react"
import { useState } from "react"
import { HistoryFeedModal } from "./history-feed-modal"

export function HistoryButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton onClick={() => setOpen(true)}>
          <History className="size-4" />
          <span>History</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <HistoryFeedModal open={open} onOpenChange={setOpen} />
    </>
  )
}
