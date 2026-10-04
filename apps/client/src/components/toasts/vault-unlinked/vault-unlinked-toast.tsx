import { Toast } from "@doska/ui-kit"
import { FolderX } from "lucide-react"

interface IProps {
  visible: boolean
  path: string
}

export function VaultUnlinkedToast({ visible, path }: IProps) {
  return (
    <Toast visible={visible}>
      <div
        role="status"
        className="flex items-center gap-2 px-4 py-2.5 text-sm"
      >
        <FolderX className="size-4 shrink-0 text-muted-foreground" />
        Stopped syncing {path}
      </div>
    </Toast>
  )
}
