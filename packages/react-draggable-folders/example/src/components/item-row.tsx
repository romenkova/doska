import { FileText } from "lucide-react"
import type { TreeItem } from "../../../src"
import { cn } from "../lib/cn"
import type { Item } from "../lib/data"
import { DRAGGING_ROW } from "../lib/row-styles"

interface IProps {
  item: TreeItem<Item>
  dragging: boolean
}

export function ItemRow({ item, dragging }: IProps) {
  return (
    <div
      className={cn(
        "flex h-8 items-center gap-2 rounded-lg px-2 text-zinc-800 hover:bg-zinc-200/60 dark:text-zinc-200 dark:hover:bg-zinc-800",
        dragging && DRAGGING_ROW
      )}
    >
      <FileText className="size-4 shrink-0 text-zinc-500 dark:text-zinc-400" />
      <span className="truncate">{item.data.title}</span>
    </div>
  )
}
