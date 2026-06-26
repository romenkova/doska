import { Button } from "@doska/ui-kit"
import { Eye, Lock, LockOpen, PencilLine, X } from "lucide-react"

interface IProps {
  onClose: () => void
  onTogglePreivew: () => void
  onToggleLock: () => void
  isPreview: boolean
  isLocked: boolean
  onSave: () => void
}

export function CardModalHeader({
  onClose,
  isPreview,
  isLocked,
  onSave,
  onToggleLock,
  onTogglePreivew,
}: IProps) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-2 border-b px-3 pt-[max(0.625rem,env(safe-area-inset-top))] pb-2">
      <div className="flex w-20 justify-start">
        <Button variant="ghost" size="icon-sm" onClick={onClose}>
          <X />
        </Button>
      </div>
      <div className="flex justify-end space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleLock}
          aria-pressed={isLocked}
        >
          {isLocked ? <Lock /> : <LockOpen />}
          {isLocked ? "Locked" : "Lock"}
        </Button>
        <Button variant="ghost" size="sm" onClick={onTogglePreivew}>
          {isPreview ? <PencilLine /> : <Eye />}
          {isPreview ? "Edit" : "Preview"}
        </Button>
        <Button size="sm" onClick={onSave}>
          Save
        </Button>
      </div>
    </div>
  )
}
