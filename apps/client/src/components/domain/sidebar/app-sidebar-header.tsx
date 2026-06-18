import { SidebarHeader, SidebarMenu, SidebarMenuItem } from "@/components/ui"
import { Anchor } from "lucide-react"
import { Link } from "wouter"

export function AppSidebarHeader() {
  return (
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <Link to="~/">
            <div className="flex items-center space-x-2">
              <Anchor className="size-4" />
              <span className="cn-font-heading text-base font-semibold">
                Deck
              </span>
            </div>
          </Link>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  )
}
