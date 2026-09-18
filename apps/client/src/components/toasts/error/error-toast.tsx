import { Toast } from "@doska/ui-kit"
import { TriangleAlert } from "lucide-react"

interface IProps {
  visible: boolean
  message: string
}

export function ErrorToast({ visible, message }: IProps) {
  return (
    <Toast visible={visible}>
      <div
        role="status"
        className="flex items-center gap-2 px-4 py-2.5 text-sm"
      >
        <TriangleAlert className="size-4 shrink-0 text-destructive" />
        {message}
      </div>
    </Toast>
  )
}
