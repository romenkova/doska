import { initials } from "@/lib/utils"
import {
  Avatar,
  AvatarFallback,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@deck/ui-kit"

const account = {
  name: "Margarita R.",
  email: "rita.romenkova@gmail.com",
}

export function SidebarAccount() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" className="pointer-events-none">
          <Avatar className="size-8 rounded-full">
            <AvatarFallback className="rounded-full text-xs">
              {initials(account.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden text-left leading-tight">
            <span className="truncate text-sm font-medium">{account.name}</span>
            <span className="truncate text-xs text-muted-foreground">
              {account.email}
            </span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
