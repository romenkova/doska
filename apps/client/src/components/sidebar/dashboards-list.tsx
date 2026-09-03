import {
  Button,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from "@doska/ui-kit"
import { Folder, Plus } from "lucide-react"
import { type Dashboard } from "@doska/core/types"
import { useSidebarTree } from "@doska/core/queries"
import { useCreateFolder, useSetFolderCollapsed } from "@doska/core/mutations"
import { useDashboardNav } from "@/lib/hooks"
import { BoardItem } from "./board-item"
import { FolderItem } from "./folder-item"

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
  const { data: nodes = [] } = useSidebarTree()
  const { selectDashboard, createAndOpenDashboard } = useDashboardNav()
  const { mutate: createFolder } = useCreateFolder()
  const { mutate: setFolderCollapsed } = useSetFolderCollapsed()
  const shared = new Set(sharedIds)
  const published = new Set(publishedIds)

  const boardItem = (dashboard: Dashboard) => (
    <BoardItem
      key={dashboard.id}
      dashboard={dashboard}
      isActive={dashboard.id === activeDashboardId}
      isPublished={published.has(dashboard.id)}
      isShared={shared.has(dashboard.id)}
      onSelect={() => selectDashboard(dashboard.id)}
    />
  )

  return (
    <SidebarGroup className="mt-4">
      <SidebarGroupLabel className="mb-1 gap-1 rounded-none pr-0">
        <span className="flex-1 text-sm">Boards</span>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="New folder"
          className="text-muted-foreground"
          onClick={() => createFolder("New folder")}
        >
          <Folder />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="New board"
          className="text-muted-foreground"
          onClick={createAndOpenDashboard}
        >
          <Plus />
        </Button>
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {nodes.map((node) =>
            node.type === "board" ? (
              boardItem(node.dashboard)
            ) : (
              <FolderItem
                key={node.id}
                node={node}
                onToggle={() =>
                  setFolderCollapsed({
                    id: node.id,
                    collapsed: !node.collapsed,
                  })
                }
                renderBoard={boardItem}
              />
            )
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
