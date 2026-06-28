import { cn, SidebarHeader, SidebarMenu, SidebarMenuItem } from "@doska/ui-kit"
import { Anchor } from "lucide-react"
import { Link } from "wouter"
import { useAppVersion } from "@/lib/version"
import { useUpdateState } from "@/lib/update-store"

export function AppSidebarHeader() {
  const version = useAppVersion()
  const update = useUpdateState()
  const newVersion = update.status === "available" ? update.version : null

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
              <span
                title={
                  newVersion ? `Update to v${newVersion} available` : undefined
                }
                className={cn(
                  "line-clamp-1 text-sm font-normal",
                  newVersion
                    ? "font-medium text-primary"
                    : "text-muted-foreground"
                )}
              >
                v{version.replace("v", "")}
              </span>
            </div>
          </Link>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  )
}
