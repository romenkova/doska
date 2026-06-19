import { type Dashboard } from "@/lib/types"
import {
  Button,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
} from "@/components/ui"
import { AppSidebarHeader } from "./app-sidebar-header"
import { DashboardsList } from "./dashboards-list"
import { ThemeToggle } from "./theme-toggle"
import { SidebarAccount } from "./sidebar-account"

type AppSidebarProps = {
  dashboards: Dashboard[]
  activeDashboardId: string
  onSelectDashboard: (dashboard: Dashboard) => void
  onCreateDashboard: () => void
}

export function AppSidebar({
  dashboards,
  activeDashboardId,
  onSelectDashboard,
  onCreateDashboard,
}: AppSidebarProps) {
  return (
    <Sidebar>
      <AppSidebarHeader />
      <SidebarContent>
        <SidebarGroup>
          <Button variant="secondary" onClick={onCreateDashboard}>
            Add a dashboard
          </Button>
        </SidebarGroup>
        <DashboardsList
          dashboards={dashboards}
          activeDashboardId={activeDashboardId}
          onSelectDashboard={onSelectDashboard}
        />
      </SidebarContent>
      <SidebarFooter>
        <ThemeToggle />
        <SidebarAccount />
      </SidebarFooter>
    </Sidebar>
  )
}
