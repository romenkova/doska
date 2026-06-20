import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@deck/ui-kit"
import { type Dashboard } from "@/lib/types"

interface IProps {
  dashboards: Dashboard[]
  activeDashboardId: string
  onSelectDashboard: (dashboard: Dashboard) => void
}

export function DashboardsList({
  dashboards,
  activeDashboardId,
  onSelectDashboard,
}: IProps) {
  if (!dashboards.length) return null
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Dashboards</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {dashboards.map((dashboard) => (
            <SidebarMenuItem key={dashboard.id}>
              <SidebarMenuButton
                isActive={dashboard.id === activeDashboardId}
                tooltip={dashboard.title}
                onClick={() => onSelectDashboard(dashboard)}
              >
                <span>{dashboard.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
