import { useState } from "react"
import { Button, SidebarTrigger } from "@doska/ui-kit"
import { ArrowRightLeft, Plus, Trash2 } from "lucide-react"
import { EditableTitle } from "../editable-title"
import { ConfirmDialog } from "../confirm-dialog"
import { ReorderColumnsModal } from "./reorder-columns-modal"
import type { Column } from "@/lib/types"

interface IProps {
  title: string
  columns: Column[]
  onRename: (name: string) => void
  onDelete: () => void
  onAddColumn: () => void
  onReorderColumns: (changed: Column[]) => void
}

export function DeckHeader({
  title,
  columns,
  onRename,
  onDelete,
  onAddColumn,
  onReorderColumns,
}: IProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [reorderOpen, setReorderOpen] = useState(false)

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
        <Button
          variant="ghost"
          aria-label="Reorder columns"
          onClick={() => setReorderOpen(true)}
          disabled={columns.length < 2}
          className="text-muted-foreground"
          size="icon-sm"
        >
          <ArrowRightLeft />
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label="Add column"
          className="text-muted-foreground"
          onClick={onAddColumn}
        >
          <Plus />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
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
      <ReorderColumnsModal
        open={reorderOpen}
        onOpenChange={setReorderOpen}
        columns={columns}
        onReorder={onReorderColumns}
      />
    </header>
  )
}
