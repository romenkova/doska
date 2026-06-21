import { Button, SidebarTrigger } from "@doska/ui-kit"
import { Plus, Trash2 } from "lucide-react"
import { EditableTitle } from "../editable-title"

interface IProps {
  title: string
  onRename: (name: string) => void
  onDelete: () => void
  onAddColumn: () => void
}

export function DeckHeader({ title, onRename, onDelete, onAddColumn }: IProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger />
      <EditableTitle
        value={title}
        onCommit={onRename}
        label="Board name"
        className="min-w-67.5 text-base font-semibold"
      />
      <div className="ml-auto flex items-center gap-1">
        <Button variant="ghost" aria-label="Add column" onClick={onAddColumn}>
          <Plus /> <span>Column</span>
        </Button>
        <Button
          variant="ghost"
          aria-label="Delete board"
          onClick={onDelete}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 />
        </Button>
      </div>
    </header>
  )
}
