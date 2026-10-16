import { Button, Toast } from "@doska/ui-kit"

interface IProps {
  visible: boolean
  onRetry: () => void
  onContinueOffline: () => void
}

export function OfflineToastContent({
  visible,
  onRetry,
  onContinueOffline,
}: IProps) {
  return (
    <Toast visible={visible} className="w-full max-w-xl gap-3">
      <div>
        <div className="font-medium">Not syncing</div>
        <div className="text-muted-foreground">
          Can not connect to server. You might be offline, or unauthenticated.
          Data is saved on this device.
        </div>
      </div>
      <Button
        size="sm"
        variant="secondary"
        className="shrink-0"
        onClick={onRetry}
      >
        Retry
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="shrink-0"
        onClick={onContinueOffline}
      >
        Continue offline
      </Button>
    </Toast>
  )
}
