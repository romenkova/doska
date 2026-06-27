import { SidebarHeader, SidebarMenu, SidebarMenuItem } from "@doska/ui-kit"
import { Anchor } from "lucide-react"
import { Link } from "wouter"
import { useAppVersion } from "@/lib/version"

export function AppSidebarHeader() {
  const version = useAppVersion()

  return (
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <Link to="~/">
            <div className="flex items-center space-x-2">
              <Anchor className="size-4" />
              <span className="cn-font-heading text-base font-semibold">
                Doska
              </span>
              <span className="line-clamp-1 text-sm font-normal text-muted-foreground">
                v{version.replace("v", "")}
              </span>
            </div>
          </Link>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  )
}
