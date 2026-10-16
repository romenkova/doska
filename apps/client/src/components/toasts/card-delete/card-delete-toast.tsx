import { Button, Toast } from "@doska/ui-kit"

interface IProps {
  visible: boolean
  title: string
  onUndo: () => void
}

/** Content for the global toast shown after deleting a card. */
export function CardDeleteToast({ visible, title, onUndo }: IProps) {
  return (
    <Toast visible={visible} className="gap-3">
      <span className="min-w-0 flex-1 truncate">{title} deleted</span>
      <Button
        variant="secondary"
        size="sm"
        className="shrink-0"
        onClick={onUndo}
      >
        Undo
      </Button>
    </Toast>
  )
}
