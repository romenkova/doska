import {
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuSub,
  MenuSubTrigger,
} from "@doska/ui-kit"
import { ArrowRightLeft, Pencil, Trash2 } from "lucide-react"
import type { Column } from "@/lib/types"

interface IProps {
  onEdit: () => void
  onDelete: () => void
  align?: "start" | "center" | "end"
  move?: IMove
}

interface IMove {
  columns: Column[]
  currentColumnId: string
  onMoveToColumn: (columnId: string) => void
}

export function CardMenuItems({
  onEdit,
  onDelete,
  align = "end",
  move,
}: IProps) {
  return (
    <MenuContent align={align} onClick={(e) => e.stopPropagation()}>
      <MenuItem onClick={onEdit}>
        <Pencil />
        Edit
      </MenuItem>
      {move && <MoveToColumnSub {...move} />}
      <MenuSeparator />
      <MenuItem
        onClick={onDelete}
        className="ml-auto data-highlighted:text-destructive"
      >
        <Trash2 />
        Delete
      </MenuItem>
    </MenuContent>
  )
}

function MoveToColumnSub({ columns, currentColumnId, onMoveToColumn }: IMove) {
  return (
    <MenuSub>
      <MenuSubTrigger>
        <ArrowRightLeft />
        Move to
      </MenuSubTrigger>
      <MenuContent align="start" sideOffset={2}>
        {columns.map((column) => (
          <MenuItem
            key={column.id}
            disabled={column.id === currentColumnId}
            onClick={() => onMoveToColumn(column.id)}
            className="data-disabled:pointer-events-none data-disabled:opacity-50"
          >
            {column.title}
          </MenuItem>
        ))}
      </MenuContent>
    </MenuSub>
  )
}
