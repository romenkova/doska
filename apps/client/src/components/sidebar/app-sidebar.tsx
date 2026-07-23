import { useLocation } from "wouter"
import { type Dashboard } from "@/lib/types"
import { routes } from "@/lib/routes"
import {
  Button,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@doska/ui-kit"
import { AppSidebarHeader } from "./app-sidebar-header"
import { DashboardsList } from "./dashboards-list"
import { ThemeToggle } from "./theme-toggle"
import { SidebarAccount } from "./sidebar-account"
import { GitHubButton } from "./github-button"
import { SettingsButton } from "@/components/settings/settings-button"

type AppSidebarProps = {
  dashboards: Dashboard[]
  activeDashboardId: string
  isDigestActive: boolean
  onSelectDashboard: (dashboard: Dashboard) => void
  onCreateDashboard: () => void
}

export function AppSidebar({
  dashboards,
  activeDashboardId,
  isDigestActive,
  onSelectDashboard,
  onCreateDashboard,
}: AppSidebarProps) {
  const [, navigate] = useLocation()
  return (
    <Sidebar>
      <AppSidebarHeader />
      <SidebarContent>
        <SidebarGroup>
          <Button variant="secondary" onClick={onCreateDashboard}>
            Add a dashboard
          </Button>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={isDigestActive}
                tooltip="Upcoming"
                onClick={() => navigate(`~${routes.digest()}`)}
              >
                <span>Upcoming</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <DashboardsList
          dashboards={dashboards}
          activeDashboardId={activeDashboardId}
          onSelectDashboard={onSelectDashboard}
        />
      </SidebarContent>
      <SidebarFooter>
        <ThemeToggle />
        <SettingsButton />
        <GitHubButton />
        <SidebarAccount />
      </SidebarFooter>
    </Sidebar>
  )
}
