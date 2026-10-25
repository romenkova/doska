import {
  ChevronRight,
  Folder,
  FolderOpen,
  FolderPlus,
  Pencil,
  X,
} from "lucide-react"
import type { TreeFolder } from "../../../src"
import { cn } from "../lib/cn"
import type { Folder as FolderData, Item } from "../lib/data"
import { DRAGGING_ROW } from "../lib/row-styles"
import { IconButton } from "./icon-button"

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
        className="h-8 w-full rounded-lg bg-white px-2 text-sm font-medium ring-2 ring-accent-500 outline-none dark:bg-zinc-800"
      />
    )
  }

  return (
    <div
      onClick={onToggle}
      className={cn(
        "group flex h-8 cursor-default items-center gap-1.5 rounded-lg px-2 font-medium text-zinc-950 hover:bg-zinc-200/60 dark:text-zinc-50 dark:hover:bg-zinc-800",
        isDropTarget &&
          "bg-accent-100 text-accent-800 hover:bg-accent-100 dark:bg-accent-500/20 dark:text-accent-200 dark:hover:bg-accent-500/20",
        dragging && DRAGGING_ROW
      )}
    >
      <ChevronRight
        className={cn(
          "-ml-1 size-3.5 shrink-0 text-zinc-500 dark:text-zinc-400 transition-transform duration-150",
          !collapsed && "rotate-90"
        )}
      />
      <FolderIcon
        className={cn(
          "size-4 shrink-0 text-zinc-500 dark:text-zinc-400",
          isDropTarget &&
            "fill-accent-200 text-accent-600 dark:fill-accent-500/30 dark:text-accent-300"
        )}
      />
      <span className="flex-1 truncate">{folder.data.title}</span>
      <span className="flex opacity-0 transition-opacity group-hover:opacity-100">
        <IconButton label="Rename" onClick={onRenameStart}>
          <Pencil className="size-3.5" />
        </IconButton>
        <IconButton label="New subfolder" onClick={onNewSubfolder}>
          <FolderPlus className="size-3.5" />
        </IconButton>
        <IconButton label="Delete" onClick={onDelete}>
          <X className="size-3.5" />
        </IconButton>
      </span>
    </div>
  )
}
