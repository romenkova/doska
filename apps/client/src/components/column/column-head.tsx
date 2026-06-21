import { useState } from "react"
import { Button, cn } from "@doska/ui-kit"
import { Eye, EyeOff, Trash2 } from "lucide-react"
import { EditableTitle } from "../editable-title"
import { ConfirmDialog } from "../confirm-dialog"

interface IProps {
  title: string
  showBody: boolean
  onToggleBody: () => void
  onRename: (title: string) => void
  onDelete: () => void
}

export function ColumnHead({
  onToggleBody,
  onRename,
  onDelete,
  showBody,
  title,
}: IProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <div
      className={cn(
        "sticky top-0 z-10 flex items-center justify-between gap-2 py-3",
        "bg-background/80 backdrop-blur-xs",
        "text-muted-foreground uppercase"
      )}
    >
      <EditableTitle
        value={title}
        onCommit={onRename}
        label={`Rename ${title}`}
        className="uppercase"
      />
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon-lg"
          aria-pressed={showBody}
          aria-label={
            showBody ? `Hide body in ${title}` : `Show body in ${title}`
          }
          onClick={onToggleBody}
        >
          {showBody ? <EyeOff /> : <Eye />}
        </Button>
        <Button
          variant="ghost"
          size="icon-lg"
          onClick={() => setConfirmOpen(true)}
          aria-label={`Delete ${title}`}
          className="hover:text-destructive"
        >
          <Trash2 />
        </Button>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete column?"
        description={`"${title}" and all of its cards will be permanently deleted.`}
        confirmLabel="Delete column"
        onConfirm={onDelete}
      />
    </div>
  )
}
