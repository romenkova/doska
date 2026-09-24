import { setFolderCollapsed } from "@doska/core/folder-collapsed"
import type { SidebarFolderNode } from "@doska/core/operations"
import { IconButton } from "@doska/ui-kit-mobile"
import { router } from "expo-router"
import Folder from "lucide-react-native/icons/folder"
import FolderOpen from "lucide-react-native/icons/folder-open"
import MoreHorizontal from "lucide-react-native/icons/ellipsis"
import { View } from "react-native"
import Sortable from "react-native-sortables"
import { ROUTES } from "@/lib/routes"
import { SidebarButton } from "./sidebar-button"

interface IProps {
  folder: SidebarFolderNode
  collapsed: boolean
}

export function FolderRow({ folder, collapsed }: IProps) {
  return (
    <View className="flex-row items-center">
      <View className="flex-1">
        <Sortable.Handle>
          <Sortable.Touchable
            onTap={() => setFolderCollapsed(folder.id, !collapsed)}
          >
            <SidebarButton
              icon={collapsed ? Folder : FolderOpen}
              label={folder.title || "Untitled folder"}
            />
          </Sortable.Touchable>
        </Sortable.Handle>
      </View>
      <IconButton
        icon={MoreHorizontal}
        label={`${folder.title} actions`}
        size={16}
        onPress={() => router.push(ROUTES.folderActions(folder.id))}
      />
    </View>
  )
}
