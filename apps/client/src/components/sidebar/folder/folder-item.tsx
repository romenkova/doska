import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@doska/ui-kit"
import { Folder } from "lucide-react"
import type { ReactNode } from "react"
import type { SidebarFolderNode } from "@doska/core/operations"
import type { Dashboard } from "@doska/core/types"
import { FolderMenu } from "./folder-menu"
import { FolderTitleInput } from "./folder-title-input"

interface IProps {
  node: SidebarFolderNode
  renaming: boolean
  onToggle: () => void
  onRenameStart: () => void
  onRename: (title: string) => void
  onRenameEnd: () => void
  onDelete: () => void
  renderBoard: (dashboard: Dashboard) => ReactNode
}

export function FolderItem({
  node,
  renaming,
  onToggle,
  onRenameStart,
  onRename,
  onRenameEnd,
  onDelete,
  renderBoard,
}: IProps) {
  return (
    <SidebarMenuItem>
      {renaming ? (
        <FolderTitleInput
          value={node.title}
          onCommit={onRename}
          onDone={onRenameEnd}
        />
      ) : (
        <>
          <SidebarMenuButton
            tooltip={node.title}
            aria-expanded={!node.collapsed}
            onClick={onToggle}
            className="pr-8"
          >
            <Folder className="size-3.5 text-muted-foreground" />
            <span className="truncate">{node.title}</span>
          </SidebarMenuButton>
          <FolderMenu onRename={onRenameStart} onDelete={onDelete} />
        </>
      )}
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
