import { useState } from "react"
import { Button, cn, InvisibleInput, SidebarTrigger } from "@doska/ui-kit"
import { ArrowRightLeft, CalendarArrowDown, Plus, Settings } from "lucide-react"
import { modals, useModal } from "@/lib/hooks"
import { ReorderColumnsModal } from "./reorder-columns/reorder-columns-modal"
import type { Column } from "@/lib/types"

interface IProps {
  title: string
  columns: Column[]
  sortByDeadline: boolean
  onRename: (name: string) => void
  onToggleSort: () => void
  onAddColumn: () => void
  onReorderColumns: (changed: Column[]) => void
}

export function DeckHeader({
  title,
  columns,
  sortByDeadline,
  onRename,
  onToggleSort,
  onAddColumn,
  onReorderColumns,
}: IProps) {
  const [reorderOpen, setReorderOpen] = useState(false)
  const { open } = useModal()

  return (
    <header className="flex h-11.5 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger />
      <InvisibleInput
        value={title}
        onCommit={onRename}
        label="Board name"
        className="min-w-40 text-base font-semibold sm:min-w-68"
      />

      <div className="ml-auto flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Sort cards by deadline"
          aria-pressed={sortByDeadline}
          onClick={onToggleSort}
          className={cn(
            "text-muted-foreground",
            sortByDeadline && "bg-muted text-primary hover:text-primary"
          )}
        >
          <CalendarArrowDown />
        </Button>
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
          size="icon-sm"
          variant="ghost"
          aria-label="Board settings"
          className="text-muted-foreground"
          onClick={() => open(modals.boardSettings)}
        >
          <Settings />
        </Button>
      </div>
      <ReorderColumnsModal
        open={reorderOpen}
        onOpenChange={setReorderOpen}
        columns={columns}
        onReorder={onReorderColumns}
      />
    </header>
  )
}
