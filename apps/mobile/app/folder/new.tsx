import { useCreateFolder } from "@doska/core/mutations"
import { SheetScreen } from "@doska/ui-kit-mobile"
import { router } from "expo-router"
import { NameForm } from "@/components/shell/name-form"

export default function NewFolderSheet() {
  const { mutate: createFolder } = useCreateFolder()

  return (
    <SheetScreen>
      <NameForm
        title="New folder"
        placeholder="Folder name"
        confirmLabel="Add"
        onCommit={(title) => createFolder(title)}
        onClose={() => router.back()}
      />
    </SheetScreen>
  )
}
