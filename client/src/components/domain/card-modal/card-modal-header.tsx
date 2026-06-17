import { Button } from "@/components/ui"
import { Eye } from "lucide-react"

interface IProps {
  onClose: () => void
  onTogglePreivew: () => void
  isPreview: boolean
  onSave: () => void
}

export function CardModalHeader({
  onClose,
  isPreview,
  onSave,
  onTogglePreivew,
}: IProps) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-2 border-b px-3 pt-[max(0.625rem,env(safe-area-inset-top))] pb-2">
      <div className="flex w-20 justify-start">
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>
      <div className="flex justify-end space-x-2">
        <Button variant="ghost" size="sm" onClick={onTogglePreivew}>
          <Eye />
          {isPreview ? "Back to edit" : "Preview"}
        </Button>
        <Button size="sm" onClick={onSave}>
          Save
        </Button>
      </div>
    </div>
  )
}
