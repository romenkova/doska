import { useSetFolderCollapsed } from "@doska/core/mutations"
import type { SidebarFolderNode } from "@doska/core/operations"
import { IconButton } from "@doska/ui-kit-mobile"
import { router } from "expo-router"
import Folder from "lucide-react-native/icons/folder"
import FolderOpen from "lucide-react-native/icons/folder-open"
import MoreHorizontal from "lucide-react-native/icons/ellipsis"
import { View } from "react-native"
import { ROUTES } from "@/lib/routes"
import { SidebarButton } from "./sidebar-button"

interface IProps {
  folder: SidebarFolderNode
}

export function FolderRow({ folder }: IProps) {
  const { mutate: setCollapsed } = useSetFolderCollapsed()

  return (
    <View className="flex-row items-center">
      <View className="flex-1">
        <SidebarButton
          icon={folder.collapsed ? Folder : FolderOpen}
          label={folder.title || "Untitled folder"}
          onPress={() =>
            setCollapsed({ id: folder.id, collapsed: !folder.collapsed })
          }
        />
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
