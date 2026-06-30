import { cn, SidebarHeader, SidebarMenu, SidebarMenuItem } from "@doska/ui-kit"
import { Anchor } from "lucide-react"
import { Link } from "wouter"
import { useAppVersion } from "@/lib/version"
import { isDesktop } from "@/lib/api/runtime"

export function AppSidebarHeader() {
  const version = useAppVersion()

  const versionBadge = (
    <span className="line-clamp-1 text-sm font-normal text-muted-foreground/50">
      {version}
    </span>
  )

  return (
    <SidebarHeader className={cn("relative", isDesktop() && "pt-10")}>
      {isDesktop() && (
        <div className="absolute top-0 right-4 text-xs">{versionBadge}</div>
      )}
      <SidebarMenu>
        <SidebarMenuItem>
          <Link to="~/">
            <div className="flex items-center space-x-2">
              <Anchor className="size-4" />
              <span className="cn-font-heading text-base font-semibold">
                Doska
              </span>
              {!isDesktop() && versionBadge}
            </div>
          </Link>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  )
}
