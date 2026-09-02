import { useAccount } from "@doska/core/account"
import { initials } from "@doska/core/utils"
import {
  Avatar,
  AvatarFallback,
  cn,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@doska/ui-kit"
import { LogIn, UserRound } from "lucide-react"
import { useState } from "react"
import { useLoginPrompt } from "@/providers/login-prompt/login-prompt-context"
import { AccountModal } from "./account-modal"

export function SidebarAccount() {
  const { session, name, subtitle, dropped, authed, pending } = useAccount()
  const openLogin = useLoginPrompt()
  const [open, setOpen] = useState(false)

  const login = session?.login ?? null
  const signedOut = !authed && !pending

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            aria-label={signedOut ? "Sign in to sync" : undefined}
            onClick={() => {
              if (authed) setOpen(true)
              else if (signedOut) openLogin()
            }}
          >
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
              <span
                className={cn(
                  "truncate text-xs",
                  dropped ? "text-destructive" : "text-muted-foreground"
                )}
              >
                {subtitle}
              </span>
            </div>
            {signedOut && <LogIn className="ml-auto text-muted-foreground" />}
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
      <AccountModal open={open} onOpenChange={setOpen} />
    </>
  )
}
