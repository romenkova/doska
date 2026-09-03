import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@doska/ui-kit"
import { Folder } from "lucide-react"
import type { ReactNode } from "react"
import type { SidebarFolderNode } from "@doska/core/operations"
import type { Dashboard } from "@doska/core/types"

interface IProps {
  node: SidebarFolderNode
  onToggle: () => void
  renderBoard: (dashboard: Dashboard) => ReactNode
}

export function FolderItem({ node, onToggle, renderBoard }: IProps) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        tooltip={node.title}
        aria-expanded={!node.collapsed}
        onClick={onToggle}
      >
        <Folder className="size-3.5 text-muted-foreground" />
        <span className="truncate">{node.title}</span>
      </SidebarMenuButton>
      {!node.collapsed && (
        <SidebarMenu className="mt-1 ml-4 w-auto border-l border-sidebar-border pl-2">
          {node.boards.length ? (
            node.boards.map(renderBoard)
          ) : (
            <li className="px-2 py-1 text-xs text-muted-foreground/60">
              No boards yet
            </li>
          )}
        </SidebarMenu>
      )}
    </SidebarMenuItem>
  )
}
