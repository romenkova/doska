import { Toast } from "@doska/ui-kit"
import { FolderX } from "lucide-react"

interface IProps {
  visible: boolean
  path: string
}

export function VaultUnlinkedToast({ visible, path }: IProps) {
  return (
    <Toast visible={visible}>
      <FolderX className="size-4 shrink-0 text-muted-foreground" />
      Stopped syncing {path}
    </Toast>
  )
}
