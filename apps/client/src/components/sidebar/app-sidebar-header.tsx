import { cn, SidebarHeader, SidebarMenu, SidebarMenuItem } from "@doska/ui-kit"
import { Link } from "wouter"
import { isDesktop } from "@/lib/platform"
import { FiAnchor } from "react-icons/fi"

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
            <div className="flex items-center space-x-1.5">
              <FiAnchor className="size-4 shrink-0" />
              <span className="cn-font-heading text-base text-[18px]">
                Doska
              </span>
            </div>
          </Link>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  )
}
