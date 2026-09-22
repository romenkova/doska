import { useMoveSidebarItem } from "@doska/core/mutations"
import { useSidebarTree } from "@doska/core/queries"
import type { Dashboard } from "@doska/core/types"
import { IconButton } from "@doska/ui-kit-mobile"
import { router } from "expo-router"
import FolderPlus from "lucide-react-native/icons/folder-plus"
import { useCallback, useMemo } from "react"
import { Text, View } from "react-native"
import Sortable, {
  type SortableGridDragEndParams,
  type SortableGridRenderItem,
} from "react-native-sortables"
import { ROUTES } from "@/lib/routes"
import { FolderRow } from "./folder-row"
import { SidebarButton } from "./sidebar-button"
import { sidebarRows, sidebarTarget, type SidebarRow } from "./sidebar-rows"

/** Held this long without moving, a board lifts instead of the list scrolling. */
const PICKUP_MS = 250

interface IProps {
  activeDashboardId: string | null
  onSelectDashboard: (dashboard: Dashboard) => void
}

export function DashboardsList({
  activeDashboardId,
  onSelectDashboard,
}: IProps) {
  const { data: nodes = [] } = useSidebarTree()
  const { mutate: move } = useMoveSidebarItem()
  const rows = useMemo(() => sidebarRows(nodes), [nodes])

  const renderRow = useCallback<SortableGridRenderItem<SidebarRow>>(
    ({ item }) => {
      if (item.kind === "folder") {
        return (
          <Sortable.Handle mode="non-draggable">
            <FolderRow folder={item.folder} />
          </Sortable.Handle>
        )
      }
      if (item.kind === "end") {
        const isEmpty = !item.folder.collapsed && !item.folder.boards.length
        return (
          <Sortable.Handle mode="non-draggable">
            {isEmpty ? (
              <Text className="py-2 pl-6 text-xs text-muted-foreground">
                No boards yet
              </Text>
            ) : (
              <View className="h-1" />
            )}
          </Sortable.Handle>
        )
      }
      return (
        <Sortable.Handle>
          <Sortable.Touchable onTap={() => onSelectDashboard(item.dashboard)}>
            <View className={item.folderId ? "pl-4" : undefined}>
              <SidebarButton
                label={item.dashboard.title || "Untitled board"}
                isActive={item.dashboard.id === activeDashboardId}
              />
            </View>
          </Sortable.Touchable>
        </Sortable.Handle>
      )
    },
    [activeDashboardId, onSelectDashboard]
  )

  const handleDragEnd = useCallback(
    ({ data, fromIndex, toIndex }: SortableGridDragEndParams<SidebarRow>) => {
      if (fromIndex === toIndex) return
      const moved = data[toIndex]
      if (moved?.kind !== "board") return
      move({ id: moved.key, target: sidebarTarget(data, toIndex) })
    },
    [move]
  )

  if (!nodes.length) return null

  return (
    <View className="px-2 pt-4">
      <View className="flex-row items-center justify-between pl-2">
        <Text className="text-xs font-sans-medium text-muted-foreground">
          Dashboards
        </Text>
        <IconButton
          icon={FolderPlus}
          label="New folder"
          size={16}
          onPress={() => router.push(ROUTES.folderNew)}
        />
      </View>
      <Sortable.Grid
        columns={1}
        data={rows}
        keyExtractor={(row) => row.key}
        renderItem={renderRow}
        rowGap={2}
        customHandle
        dragActivationDelay={PICKUP_MS}
        enableActiveItemSnap={false}
        hapticsEnabled
        showDropIndicator
        onDragEnd={handleDragEnd}
      />
    </View>
  )
}
