import { Button } from "@doska/ui-kit"
import { Trash2 } from "lucide-react"

interface IProps {
  onDelete: () => void
}

/** Settings section for permanently deleting the board (confirmed elsewhere). */
export function DeleteSection({ onDelete }: IProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">Delete board</span>
      <span className="text-xs text-muted-foreground">
        Permanently deletes this board and all of its columns and cards.
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={onDelete}
        className="mt-1 self-start text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 />
        Delete board
      </Button>
    </div>
  )
}
