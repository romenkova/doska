import { SidebarMenuButton, SidebarMenuItem } from "@doska/ui-kit"
import { useLocation, useRouter } from "wouter"
import { routes } from "@/lib/routes"

/** Sidebar entry that opens the digest of deadlined cards. */
export function UpcomingButton() {
  const [, navigate] = useLocation()
  // Nested route, so the match is on the router base rather than the location.
  const isActive = useRouter().base === routes.digest()

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive}
        tooltip="Upcoming"
        onClick={() => navigate(`~${routes.digest()}`)}
      >
        <span>Upcoming</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
