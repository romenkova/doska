import { SidebarMenuButton, cn } from "@doska/ui-kit"
import { Folder, FolderOpen } from "lucide-react"
import type { SidebarFolderNode } from "@doska/core/operations"
import {
  useDeleteFolder,
  useRenameFolder,
  useSetFolderCollapsed,
} from "@doska/core/mutations"
import { useCardDrop } from "@/providers/card-drop/card-drop-context"
import { FolderMenu } from "./folder-menu"
import { FolderTitleInput } from "./folder-title-input"
import { useEffect, useMemo } from "react"

const OPEN_ON_HOVER_MS = 500

interface IProps {
  node: SidebarFolderNode
  renaming: boolean
  isDropTarget: boolean
  onRenameStart: () => void
  onRenameEnd: () => void
}

export function FolderItem({
  node,
  renaming,
  isDropTarget,
  onRenameStart,
  onRenameEnd,
}: IProps) {
  const { mutate: setCollapsed } = useSetFolderCollapsed()
  const { mutate: rename } = useRenameFolder()
  const { mutate: remove } = useDeleteFolder()

  // A dragged card hovers a collapsed folder: it opens to offer its boards.
  const { target } = useCardDrop()
  const opensOnHover = target?.id === node.id && node.collapsed
  useEffect(() => {
    if (!opensOnHover) return
    const timer = setTimeout(
      () => setCollapsed({ id: node.id, collapsed: false }),
      OPEN_ON_HOVER_MS
    )
    return () => clearTimeout(timer)
  }, [opensOnHover, node.id, setCollapsed])

  const FolderIcon = useMemo(() => {
    if (node.collapsed || isDropTarget) return Folder
    return FolderOpen
  }, [node.collapsed, isDropTarget])

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
            aria-expanded={!node.collapsed}
            onClick={() =>
              setCollapsed({ id: node.id, collapsed: !node.collapsed })
            }
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
