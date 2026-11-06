import { useState } from "react"
import {
  Button,
  cn,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@doska/ui-kit"
import { Folder, FolderSync } from "lucide-react"
import { useVaultContext } from "@/providers/vault/vault-context"
import { VaultModal } from "./vault-modal"

/**
 * Opens the folder sync settings. The files are left behind when the sync
 * stops: unmounting stops the sync, it doesn't undo it.
 */
export function VaultButton() {
  const [open, setOpen] = useState(false)
  const { available, path, error, mount, unmount } = useVaultContext()
  if (!available) return null

  const label = path ? `Syncing with ${path}` : "Sync with a folder"

  const button = (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      className={cn(
        error && "text-destructive",
        !error && path ? "text-foreground" : "text-muted-foreground"
      )}
      onClick={() => setOpen(true)}
    >
      {path ? <FolderSync /> : <Folder />}
    </Button>
  )

  return (
    <>
      <Tooltip>
        <TooltipTrigger render={button} />
        <TooltipContent>{error ?? label}</TooltipContent>
      </Tooltip>
      <VaultModal
        open={open}
        onOpenChange={setOpen}
        path={path}
        error={error}
        mount={mount}
        unmount={unmount}
      />
    </>
  )
}
