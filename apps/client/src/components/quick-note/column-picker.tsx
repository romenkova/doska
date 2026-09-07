import type { Column } from "@doska/core/types"
import { MenuItem } from "@doska/ui-kit"
import { Picker } from "./picker"

interface IProps {
  columns: Column[]
  column: Column
  onPick: (id: string) => void
}

export function ColumnPicker({ columns, column, onPick }: IProps) {
  return (
    <Picker label={column.title}>
      {columns.map((c) => (
        <MenuItem key={c.id} onClick={() => onPick(c.id)}>
          {c.title}
        </MenuItem>
      ))}
    </Picker>
  )
}
