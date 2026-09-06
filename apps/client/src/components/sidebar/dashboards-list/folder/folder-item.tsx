import { SidebarMenuButton, cn } from "@doska/ui-kit"
import { Folder } from "lucide-react"
import type { SidebarFolderNode } from "@doska/core/operations"
import {
  useDeleteFolder,
  useRenameFolder,
  useSetFolderCollapsed,
} from "@doska/core/mutations"
import { FolderMenu } from "./folder-menu"
import { FolderTitleInput } from "./folder-title-input"

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
            className="pr-8"
          >
            <Folder
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
