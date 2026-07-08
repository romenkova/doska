import { initials } from "@/lib/utils"
import {
  Avatar,
  AvatarFallback,
  Button,
  SidebarMenu,
  SidebarMenuItem,
} from "@doska/ui-kit"
import { FolderSync, LogIn, LogOut, UserRound } from "lucide-react"
import { useSyncExternalStore } from "react"
import { useLoginPrompt } from "@/components/login/login-prompt-context"
import {
  getSyncFolder,
  getSyncTarget,
  subscribeSyncConfig,
} from "@/lib/api/runtime"
import { useLogout } from "@/lib/data/mutations"
import { useAuth } from "@/lib/hooks"

/** Last path segment of a folder, for a compact label. */
function basename(path: string): string {
  return path.split(/[\\/]/).filter(Boolean).pop() ?? path
}

/**
 * The sync identity row. Local-folder and server are equally-legitimate sync
 * backends, so the row is **backend-first**: it shows the folder for the folder
 * backend and the account for the server backend. "Signing in" only exists for
 * the server — the folder backend has no account.
 */
export function SidebarAccount() {
  const target = useSyncExternalStore(subscribeSyncConfig, getSyncTarget)
  const folder = useSyncExternalStore(subscribeSyncConfig, getSyncFolder)

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className="flex h-12 w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm [&>svg]:size-4 [&>svg]:shrink-0">
          {target === "folder" ? (
            <FolderRow folder={folder} />
          ) : (
            <ServerRow />
          )}
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

/** Folder backend: the mirror folder, or a prompt to pick one. No account. */
function FolderRow({ folder }: { folder: string }) {
  const openSync = useLoginPrompt()
  const configured = folder !== ""

  return (
    <>
      <Avatar className="size-8 rounded-full">
        <AvatarFallback className="rounded-full text-xs">
          <FolderSync className="size-4" />
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col overflow-hidden text-left leading-tight">
        <span className="truncate text-sm font-medium">
          {configured ? "Local folder" : "This device"}
        </span>
        <span className="truncate text-xs text-muted-foreground">
          {configured ? basename(folder) : "Sync not set up"}
        </span>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Sync settings"
        title="Sync settings"
        className="ml-auto text-muted-foreground"
        onClick={openSync}
      >
        <FolderSync />
      </Button>
    </>
  )
}

/** Server backend: the signed-in account, or a prompt to set up sync. */
function ServerRow() {
  const { authed, login } = useAuth()
  const openSync = useLoginPrompt()
  const { mutate: logout } = useLogout()

  // `authed === null` is the pre-check state — a neutral placeholder so neither
  // the wrong identity nor a control flashes.
  const name =
    authed === null ? "…" : authed ? (login ?? "Signed in") : "This device"
  const subtitle =
    authed === null ? "" : authed ? "Syncing" : "Sync not set up"

  return (
    <>
      <Avatar className="size-8 rounded-full">
        <AvatarFallback className="rounded-full text-xs">
          {authed && login ? initials(login) : <UserRound className="size-4" />}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col overflow-hidden text-left leading-tight">
        <span className="truncate text-sm font-medium">{name}</span>
        <span className="truncate text-xs text-muted-foreground">
          {subtitle}
        </span>
      </div>
      {authed === true && (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Sign out"
          title="Sign out"
          className="ml-auto text-muted-foreground"
          onClick={() => logout()}
        >
          <LogOut />
        </Button>
      )}
      {authed === false && (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Set up sync"
          title="Set up sync"
          className="ml-auto text-muted-foreground"
          onClick={openSync}
        >
          <LogIn />
        </Button>
      )}
    </>
  )
}
