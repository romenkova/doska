import { Button } from "@doska/ui-kit"
import { Settings } from "lucide-react"
import { useState } from "react"
import { AccountsModal } from "@/components/accounts/accounts-modal"
import { LocalMcpModal } from "@/components/local-mcp/local-mcp-modal"
import { SettingsModal } from "./settings-modal"

/** Sidebar entry that opens the settings modal. */
export function SettingsButton() {
  const [open, setOpen] = useState(false)
  const [accountsOpen, setAccountsOpen] = useState(false)
  const [localMcpOpen, setLocalMcpOpen] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="justify-start gap-2 px-2"
        onClick={() => setOpen(true)}
      >
        <Settings className="size-4" />
        <span>Settings</span>
      </Button>
      <SettingsModal
        open={open}
        onOpenChange={setOpen}
        onOpenAccounts={() => {
          // Stacked dialogs trap focus in each other, so settings steps aside.
          setOpen(false)
          setAccountsOpen(true)
        }}
        onOpenLocalMcp={() => {
          setOpen(false)
          setLocalMcpOpen(true)
        }}
      />
      <AccountsModal open={accountsOpen} onOpenChange={setAccountsOpen} />
      <LocalMcpModal open={localMcpOpen} onOpenChange={setLocalMcpOpen} />
    </>
  )
}
