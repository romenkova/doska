import { useState } from "react"
import { Button, SidebarTrigger } from "@doska/ui-kit"
import { Plus, Trash2 } from "lucide-react"
import { EditableTitle } from "../editable-title"
import { ConfirmDialog } from "../confirm-dialog"

interface IProps {
  title: string
  onRename: (name: string) => void
  onDelete: () => void
  onAddColumn: () => void
}

export function DeckHeader({ title, onRename, onDelete, onAddColumn }: IProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger />
      <EditableTitle
        value={title}
        onCommit={onRename}
        label="Board name"
        className="min-w-40 text-base font-semibold sm:min-w-68"
      />
      <div className="ml-auto flex items-center gap-1">
        <Button variant="ghost" aria-label="Add column" onClick={onAddColumn}>
          <Plus /> <span>Column</span>
        </Button>
        <Button
          variant="ghost"
          aria-label="Delete board"
          onClick={() => setConfirmOpen(true)}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 />
        </Button>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete board?"
        description={`"${title}" and all of its columns and cards will be permanently deleted.`}
        confirmLabel="Delete board"
        onConfirm={onDelete}
      />
    </header>
  )
}
