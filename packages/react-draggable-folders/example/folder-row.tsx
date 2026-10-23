import {
  ChevronRight,
  Folder,
  FolderOpen,
  FolderPlus,
  Pencil,
  X,
} from "lucide-react"
import type { TreeFolder } from "../src"
import { cn } from "./cn"
import type { Folder as FolderData, Item } from "./data"
import { RowButton } from "./row-button"

interface IProps {
  folder: TreeFolder<Item, FolderData>
  dragging: boolean
  collapsed: boolean
  isDropTarget: boolean
  renaming: boolean
  onToggle: () => void
  onRenameStart: () => void
  onRename: (title: string) => void
  onNewSubfolder: () => void
  onDelete: () => void
}

export function FolderRow({
  folder,
  dragging,
  collapsed,
  isDropTarget,
  renaming,
  onToggle,
  onRenameStart,
  onRename,
  onNewSubfolder,
  onDelete,
}: IProps) {
  const FolderIcon = collapsed || isDropTarget ? Folder : FolderOpen

  if (renaming) {
    return (
      <input
        autoFocus
        defaultValue={folder.data.title}
        onFocus={(event) => event.target.select()}
        onBlur={(event) => onRename(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur()
        }}
        className="h-8 w-full rounded-lg bg-white px-2 text-sm font-medium ring-2 ring-violet-500 outline-none dark:bg-zinc-800"
      />
    )
  }

  return (
    <div
      onClick={onToggle}
      className={cn(
        "group flex h-8 cursor-default items-center gap-1.5 rounded-lg px-2 font-medium text-zinc-900 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800",
        isDropTarget &&
          "bg-violet-50 text-violet-700 hover:bg-violet-50 dark:bg-violet-500/15 dark:text-violet-300 dark:hover:bg-violet-500/15",
        dragging &&
          "bg-white shadow-lg ring-1 shadow-zinc-900/10 ring-zinc-200 hover:bg-white dark:bg-zinc-800 dark:ring-zinc-700"
      )}
    >
      <ChevronRight
        className={cn(
          "-ml-1 size-3.5 shrink-0 text-zinc-400 transition-transform duration-150",
          !collapsed && "rotate-90"
        )}
      />
      <FolderIcon
        className={cn(
          "size-4 shrink-0 text-zinc-400",
          isDropTarget &&
            "fill-violet-200 text-violet-500 dark:fill-violet-500/30"
        )}
      />
      <span className="flex-1 truncate">{folder.data.title}</span>
      <span className="flex opacity-0 transition-opacity group-hover:opacity-100">
        <RowButton label="Rename" onClick={onRenameStart}>
          <Pencil className="size-3.5" />
        </RowButton>
        <RowButton label="New subfolder" onClick={onNewSubfolder}>
          <FolderPlus className="size-3.5" />
        </RowButton>
        <RowButton label="Delete folder, keep what it holds" onClick={onDelete}>
          <X className="size-3.5" />
        </RowButton>
      </span>
    </div>
  )
}
