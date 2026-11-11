import { MenuContent, MenuItem } from "@doska/ui-kit"
import { CopyPlus, Trash2 } from "lucide-react"

export interface BoardActions {
  onDuplicate: () => void
  onDelete: () => void
}

interface IProps extends BoardActions {
  align?: "start" | "end"
}

export function BoardMenuItems({ align, onDuplicate, onDelete }: IProps) {
  return (
    <MenuContent align={align}>
      <MenuItem onClick={onDuplicate}>
        <CopyPlus />
        Duplicate
      </MenuItem>
      <MenuItem onClick={onDelete} variant="destructive">
        <Trash2 />
        Delete board
      </MenuItem>
    </MenuContent>
  )
}
