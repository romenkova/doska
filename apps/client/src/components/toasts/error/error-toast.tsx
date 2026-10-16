import { Toast } from "@doska/ui-kit"
import { TriangleAlert } from "lucide-react"

interface IProps {
  visible: boolean
  message: string
}

export function ErrorToast({ visible, message }: IProps) {
  return (
    <Toast visible={visible}>
      <TriangleAlert className="size-4 shrink-0 text-destructive" />
      {message}
    </Toast>
  )
}
