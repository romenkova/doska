import type { Dashboard } from "@doska/core/types"
import { MenuItem } from "@doska/ui-kit"
import { Picker } from "./picker"

interface IProps {
  dashboards: Dashboard[]
  board: Dashboard | undefined
  onPick: (id: string) => void
}

export function BoardPicker({ dashboards, board, onPick }: IProps) {
  return (
    <Picker label={board ? board.title : "No boards"}>
      {dashboards.map((d) => (
        <MenuItem key={d.id} onClick={() => onPick(d.id)}>
          {d.title}
        </MenuItem>
      ))}
    </Picker>
  )
}
