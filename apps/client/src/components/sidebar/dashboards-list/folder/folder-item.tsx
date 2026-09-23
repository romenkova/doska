import { SidebarMenuButton, cn } from "@doska/ui-kit"
import { Folder, FolderOpen } from "lucide-react"
import type { SidebarFolderNode } from "@doska/core/operations"
import { setFolderCollapsed } from "@doska/core/folder-collapsed"
import { useDeleteFolder, useRenameFolder } from "@doska/core/mutations"
import { useCardDrop } from "@/providers/card-drop/card-drop-context"
import { FolderMenu } from "./folder-menu"
import { FolderTitleInput } from "./folder-title-input"
import { useEffect, useMemo } from "react"

const OPEN_ON_HOVER_MS = 500

interface IProps {
  node: SidebarFolderNode
  collapsed: boolean
  renaming: boolean
  isDropTarget: boolean
  onRenameStart: () => void
  onRenameEnd: () => void
}

export function FolderItem({
  node,
  collapsed,
  renaming,
  isDropTarget,
  onRenameStart,
  onRenameEnd,
}: IProps) {
  const { mutate: rename } = useRenameFolder()
  const { mutate: remove } = useDeleteFolder()

  // A dragged card hovers a collapsed folder: it opens to offer its boards.
  const { target } = useCardDrop()
  const opensOnHover =
    target?.kind === "folder" && target.id === node.id && collapsed
  useEffect(() => {
    if (!opensOnHover) return
    const timer = setTimeout(
      () => setFolderCollapsed(node.id, false),
      OPEN_ON_HOVER_MS
    )
    return () => clearTimeout(timer)
  }, [opensOnHover, node.id])

  const FolderIcon = useMemo(() => {
    if (collapsed || isDropTarget) return Folder
    return FolderOpen
  }, [collapsed, isDropTarget])

  return (
    <>
      {renaming ? (
        <FolderTitleInput
          value={node.title}
          onCommit={(title) => rename({ id: node.id, title })}
          onDone={onRenameEnd}
        />
      ) : (
        <>
          <SidebarMenuButton
            tooltip={node.title}
            aria-expanded={!collapsed}
            onClick={() => setFolderCollapsed(node.id, !collapsed)}
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
            <span className="truncate">{node.title}</span>
          </SidebarMenuButton>
          <FolderMenu
            onRename={onRenameStart}
            onDelete={() => remove(node.id)}
          />
        </>
      )}
    </>
  )
}
