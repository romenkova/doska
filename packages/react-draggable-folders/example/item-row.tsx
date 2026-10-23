import { FileText } from "lucide-react"
import type { TreeItem } from "../src"
import { cn } from "./cn"
import type { Item } from "./data"

interface IProps {
  item: TreeItem<Item>
  dragging: boolean
}

export function ItemRow({ item, dragging }: IProps) {
  return (
    <div
      className={cn(
        "flex h-8 items-center gap-2 rounded-lg px-2 text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800",
        dragging &&
          "bg-white shadow-lg ring-1 shadow-zinc-900/10 ring-zinc-200 hover:bg-white dark:bg-zinc-800 dark:ring-zinc-700"
      )}
    >
      <FileText className="size-4 shrink-0 text-zinc-400" />
      <span className="truncate">{item.data.title}</span>
    </div>
  )
}
