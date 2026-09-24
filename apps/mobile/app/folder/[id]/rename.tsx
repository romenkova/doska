import { useRenameFolder } from "@doska/core/mutations"
import { SheetScreen } from "@doska/ui-kit-mobile"
import { router, useLocalSearchParams } from "expo-router"
import { NameForm } from "@/components/shell/name-form"
import { useFolder } from "@/lib/use-folder"

export default function RenameFolderSheet() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const folder = useFolder(id)
  const { mutate: rename } = useRenameFolder()
  if (!folder) return null

  return (
    <SheetScreen>
      <NameForm
        title="Rename folder"
        placeholder="Folder name"
        confirmLabel="Save"
        initial={folder.title}
        onCommit={(title) => rename({ id: folder.id, title })}
        // Past the actions sheet underneath, back to the sidebar.
        onClose={() => router.dismissAll()}
      />
    </SheetScreen>
  )
}
