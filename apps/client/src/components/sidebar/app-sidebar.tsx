import { useParams } from "wouter"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarMenu,
} from "@doska/ui-kit"
import { usePublishedBoards, useSharedBoards } from "@doska/core/queries"
import { useAuth } from "@/lib/hooks"
import { AppSidebarHeader } from "./app-sidebar-header"
import { ThemeToggle } from "@/components/theme-toggle"
import { DashboardsList } from "./dashboards-list/dashboards-list"
import { SidebarAccount } from "./sidebar-account"
import { SettingsButton } from "@/components/settings/settings-button"
import { TrashButton } from "@/components/trash/trash-button"
import { UpcomingButton } from "@/components/digest/upcoming-button"
import { isDesktop } from "@/lib/platform"

export function AppSidebar() {
  const { authed } = useAuth()
  const { data: sharedIds = [] } = useSharedBoards(authed === true)
  const { data: publishedIds = [] } = usePublishedBoards(authed === true)

  const activeDashboardId = useParams().id ?? ""

  return (
    <Sidebar className="ml-1">
      {!isDesktop() && <AppSidebarHeader />}
      <SidebarContent className="group/sidebar mt-6">
        <SidebarGroup>
          <SidebarMenu>
            <UpcomingButton />
            <TrashButton />
          </SidebarMenu>
        </SidebarGroup>
        <DashboardsList
          activeDashboardId={activeDashboardId}
          sharedIds={sharedIds}
          publishedIds={publishedIds}
        />
      </SidebarContent>
      <SidebarFooter>
        <ThemeToggle />
        <SettingsButton />
        <SidebarAccount />
      </SidebarFooter>
    </Sidebar>
  )
}
