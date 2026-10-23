import { SidebarMenuButton, cn } from "@doska/ui-kit"
import { Folder, FolderOpen } from "lucide-react"
import type { SidebarFolderNode } from "@doska/core"
import { useCardDrop } from "@/providers/card-drop/card-drop-context"
import { FolderMenu } from "./folder-menu"
import { FolderTitleInput } from "./folder-title-input"
import { useEffect, useEffectEvent, useMemo } from "react"

const OPEN_ON_HOVER_MS = 500

interface IProps {
  node: SidebarFolderNode
  collapsed: boolean
  renaming: boolean
  isDropTarget: boolean
  onRenameStart: () => void
  onRename: (title: string) => void
  onRenameEnd: () => void
  onCollapsedChange: (collapsed: boolean) => void
  onNewSubfolder: () => void
  onDelete: () => void
}

export function FolderItem({
  node,
  collapsed,
  renaming,
  isDropTarget,
  onRenameStart,
  onRename,
  onRenameEnd,
  onCollapsedChange,
  onNewSubfolder,
  onDelete,
}: IProps) {
  // A dragged card hovers a collapsed folder: it opens to offer its boards.
  const { target } = useCardDrop()
  const opensOnHover =
    target?.kind === "folder" && target.id === node.id && collapsed
  const open = useEffectEvent(() => onCollapsedChange(false))
  useEffect(() => {
    if (!opensOnHover) return
    const timer = setTimeout(open, OPEN_ON_HOVER_MS)
    return () => clearTimeout(timer)
  }, [opensOnHover])

  const FolderIcon = useMemo(() => {
    if (collapsed || isDropTarget) return Folder
    return FolderOpen
  }, [collapsed, isDropTarget])

  return (
    <>
      {renaming ? (
        <FolderTitleInput
          value={node.data.title}
          onCommit={onRename}
          onDone={onRenameEnd}
        />
      ) : (
        <>
          <SidebarMenuButton
            tooltip={node.data.title}
            aria-expanded={!collapsed}
            onClick={() => onCollapsedChange(!collapsed)}
            data-drop-folder={node.id}
            className={cn(
              "pr-8",
              opensOnHover &&
                "bg-sidebar-accent ring-2 ring-primary/60 ring-inset"
            )}
          >
            <FolderIcon
              className={cn(
                "size-3.5 text-muted-foreground",
                isDropTarget && "fill-current"
              )}
            />
            <span className="truncate">{node.data.title}</span>
          </SidebarMenuButton>
          <FolderMenu
            onRename={onRenameStart}
            onNewSubfolder={onNewSubfolder}
            onDelete={onDelete}
          />
        </>
      )}
    </>
  )
}
