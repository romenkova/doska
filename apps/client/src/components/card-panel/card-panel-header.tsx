import { Button } from "@doska/ui-kit"
import { Eye, PencilLine, X } from "lucide-react"
import { AddAttachmentButton } from "../card/attachments/add-attachment-button"

interface IProps {
  onClose: () => void
  onTogglePreivew: () => void
  isPreview: boolean
  onSave: () => void
}

export function CardPanelHeader({
  onClose,
  isPreview,
  onSave,
  onTogglePreivew,
}: IProps) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-2 px-3 pt-[max(0.625rem,env(safe-area-inset-top))] pb-2">
      <div className="flex w-20 justify-start">
        <Button variant="ghost" size="icon-sm" onClick={onClose}>
          <X />
        </Button>
      </div>
      <div className="flex justify-end space-x-2">
        <AddAttachmentButton />
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
