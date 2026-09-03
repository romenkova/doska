import { cn, SidebarHeader, SidebarMenu, SidebarMenuItem } from "@doska/ui-kit"
import { Anchor } from "lucide-react"
import { Link } from "wouter"
import { isDesktop } from "@/lib/platform"

export function AppSidebarHeader() {
  return (
    <SidebarHeader
      className={cn(
        "pt-[calc(--spacing(2)+env(safe-area-inset-top))]",
        isDesktop() && "pt-10"
      )}
    >
      <SidebarMenu>
        <SidebarMenuItem>
          <Link to="~/">
            <div className="flex items-center space-x-1">
              <Anchor className="size-4 shrink-0" />
              <span className="cn-font-heading pr-2 text-base font-semibold">
                Doska
              </span>
            </div>
          </Link>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  )
}
