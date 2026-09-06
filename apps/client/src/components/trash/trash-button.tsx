import { SidebarMenuButton, SidebarMenuItem } from "@doska/ui-kit"
import { useLocation } from "wouter"
import { routes } from "@/lib/routes"

/** Sidebar entry that opens the trash. */
export function TrashButton() {
  const [location, navigate] = useLocation()
  const isActive = location === routes.trash()

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive}
        tooltip="Trash"
        onClick={() => navigate(`~${routes.trash()}`)}
      >
        <span>Trash</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
