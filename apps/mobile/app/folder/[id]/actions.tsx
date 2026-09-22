import { useDeleteFolder } from "@doska/core/mutations"
import { Separator, SheetItem, SheetScreen } from "@doska/ui-kit-mobile"
import { router, useLocalSearchParams } from "expo-router"
import Pencil from "lucide-react-native/icons/pencil"
import Trash2 from "lucide-react-native/icons/trash-2"
import { ROUTES } from "@/lib/routes"
import { useFolder } from "@/lib/use-folder"

export default function FolderActionsSheet() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const folder = useFolder(id)
  const { mutate: remove } = useDeleteFolder()
  if (!folder) return null

  return (
    <SheetScreen>
      <SheetItem
        icon={Pencil}
        label="Rename"
        onPress={() => router.push(ROUTES.folderRename(folder.id))}
      />
      <Separator className="my-1" />
      {/* No confirm, as on web: its boards just move out to the top level. */}
      <SheetItem
        icon={Trash2}
        label="Delete folder"
        destructive
        onPress={() => {
          remove(folder.id)
          router.back()
        }}
      />
    </SheetScreen>
  )
}
