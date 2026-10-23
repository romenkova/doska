import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
} from "@doska/ui-kit"
import {
  newId,
  setFolderCollapsed,
  type SidebarNode,
  useCollapsedFolders,
  useSaveSidebarTree,
  useSidebarTree,
} from "@doska/core"
import { DraggableFolders, useFolderTree } from "react-draggable-folders"
import { useState } from "react"
import { DROP_ANIMATION_MS } from "@/lib/hooks"
import { BoardItem } from "./board-item"
import { BoardsHeader } from "./boards-header"
import { FolderItem } from "./folder/folder-item"

const SIDEBAR_COMPONENTS = { List: SidebarMenu, Row: SidebarMenuItem }

// Module-level so the tree doesn't reset on every render while loading
const NO_NODES: SidebarNode[] = []

interface IProps {
  activeDashboardId: string
  sharedIds: string[]
  publishedIds: string[]
}

export function DashboardsList({
  activeDashboardId,
  sharedIds,
  publishedIds,
}: IProps) {
  const { data: nodes = NO_NODES } = useSidebarTree()
  const { mutate: saveTree } = useSaveSidebarTree()
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const collapsedIds = useCollapsedFolders()
  const shared = new Set(sharedIds)
  const published = new Set(publishedIds)
  const tree = useFolderTree({
    nodes,
    collapsedIds,
    onChange: saveTree,
    onCollapsedChange: setFolderCollapsed,
  })

  const createFolder = (parentId?: string) => {
    const id = newId("folder")
    tree.addFolder(
      {
        type: "folder",
        id,
        data: { title: "New folder" },
        folders: [],
        items: [],
      },
      parentId
    )
    setRenamingId(id)
  }

  const lifted = (dragging: boolean) =>
    dragging ? "rounded-md bg-sidebar shadow-e2" : undefined

  return (
    <SidebarGroup className="mt-4">
      <BoardsHeader onNewFolder={() => createFolder()} />
      <SidebarGroupContent>
        <DraggableFolders
          tree={tree}
          isDragDisabled={(id) => id === renamingId}
          dropAnimationMs={DROP_ANIMATION_MS}
          droppableId="sidebar"
          components={SIDEBAR_COMPONENTS}
          className="-mt-1 space-y-0"
          renderItem={(item, { dragging }) => (
            <div className="pt-1">
              <div className={lifted(dragging)}>
                <BoardItem
                  dashboard={item.data}
                  isActive={item.id === activeDashboardId}
                  isPublished={published.has(item.id)}
                  isShared={shared.has(item.id)}
                />
              </div>
            </div>
          )}
          renderFolder={(folder, { dragging, collapsed, isDropTarget }) => (
            <div className="pt-1">
              <div className={lifted(dragging)}>
                <FolderItem
                  node={folder}
                  collapsed={collapsed}
                  renaming={folder.id === renamingId}
                  isDropTarget={isDropTarget}
                  onRenameStart={() => setRenamingId(folder.id)}
                  onRename={(title) => tree.updateFolder(folder.id, { title })}
                  onRenameEnd={() => setRenamingId(null)}
                  onCollapsedChange={(collapsed) =>
                    tree.setCollapsed(folder.id, collapsed)
                  }
                  onNewSubfolder={() => createFolder(folder.id)}
                  onDelete={() => tree.removeFolder(folder.id)}
                />
              </div>
            </div>
          )}
          renderEmpty={() => (
            <div className="mt-1 flex h-8 items-center px-2 text-xs text-muted-foreground/60">
              No boards yet
            </div>
          )}
        />
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
