import { initials } from "@/lib/utils"
import {
  Avatar,
  AvatarFallback,
  Button,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@deck/ui-kit"
import { LogIn, LogOut, UserRound } from "lucide-react"
import { useLoginPrompt } from "@/components/login/login-prompt-context"
import { useLogout } from "@/lib/data/mutations"
import { useAuth } from "@/lib/hooks"

export function SidebarAccount() {
  const { authed, login } = useAuth()
  const openLogin = useLoginPrompt()
  const { mutate: logout } = useLogout()

  // `authed` is null until the first session check resolves; show a neutral
  // placeholder until then so neither the wrong identity nor a control flashes.
  const name =
    authed === null ? "…" : authed ? (login ?? "Signed in") : "Not signed in"
  const subtitle =
    authed === null ? "" : authed ? "Syncing" : "Sign in to sync"

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" className="pointer-events-none">
          <Avatar className="size-8 rounded-full">
            <AvatarFallback className="rounded-full text-xs">
              {authed && login ? (
                initials(login)
              ) : (
                <UserRound className="size-4" />
              )}
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
              className="pointer-events-auto ml-auto text-muted-foreground"
              onClick={() => logout()}
            >
              <LogOut />
            </Button>
          )}
          {authed === false && (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Sign in to sync"
              title="Sign in to sync"
              className="pointer-events-auto ml-auto text-muted-foreground"
              onClick={openLogin}
            >
              <LogIn />
            </Button>
          )}
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
