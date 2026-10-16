import { Button, Toast } from "@doska/ui-kit"
import { Sparkles, X } from "lucide-react"

interface IProps {
  visible: boolean
  onOpen: () => void
  onDismiss: () => void
}

export function WhatsNewToastContent({ visible, onOpen, onDismiss }: IProps) {
  return (
    <Toast visible={visible} className="max-w-md gap-3">
      <span className="min-w-0">Doska was updated</span>
      <Button size="sm" className="shrink-0" onClick={onOpen}>
        <Sparkles className="size-4" />
        What's new
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Dismiss"
        className="-mr-2 shrink-0"
        onClick={onDismiss}
      >
        <X />
      </Button>
    </Toast>
  )
}
