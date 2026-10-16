import { Toast } from "@doska/ui-kit"
import { Info } from "lucide-react"

interface IProps {
  visible: boolean
  reason: string
}

export function AddCardBlockedToast({ visible, reason }: IProps) {
  return (
    <Toast visible={visible}>
      <Info className="size-4 shrink-0 text-muted-foreground" />
      {reason}
    </Toast>
  )
}
