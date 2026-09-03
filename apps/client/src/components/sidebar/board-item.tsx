import { SidebarMenuButton, SidebarMenuItem } from "@doska/ui-kit"
import { Globe, Users } from "lucide-react"
import { useMemo } from "react"
import type { Dashboard } from "@doska/core/types"

interface IProps {
  dashboard: Dashboard
  isActive: boolean
  isPublished: boolean
  isShared: boolean
  onSelect: () => void
}

export function BoardItem({
  dashboard,
  isActive,
  isPublished,
  isShared,
  onSelect,
}: IProps) {
  const marker = useMemo(() => {
    if (isPublished) return { Icon: Globe, label: "Public" }
    if (isShared) return { Icon: Users, label: "Shared" }
    return null
  }, [isPublished, isShared])

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive}
        tooltip={dashboard.title}
        onClick={onSelect}
      >
        <span className="truncate">{dashboard.title}</span>
        {marker && (
          <marker.Icon
            role="img"
            aria-label={marker.label}
            className="ml-auto size-3.5 text-muted-foreground"
          />
        )}
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
