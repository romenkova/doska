import { MenuContent, MenuItem } from "@doska/ui-kit"
import { FolderPlus, Pencil, Plus, Trash2 } from "lucide-react"

export interface FolderActions {
  onRename: () => void
  onNewBoard: () => void
  onNewSubfolder?: () => void
  onDelete: () => void
}

interface IProps extends FolderActions {
  align?: "start" | "end"
}

export function FolderMenuItems({
  align,
  onRename,
  onNewBoard,
  onNewSubfolder,
  onDelete,
}: IProps) {
  return (
    <MenuContent align={align}>
      <MenuItem onClick={onRename}>
        <Pencil />
        Rename
      </MenuItem>
      <MenuItem onClick={onNewBoard}>
        <Plus />
        New board
      </MenuItem>
      {onNewSubfolder && (
        <MenuItem onClick={onNewSubfolder}>
          <FolderPlus />
          New subfolder
        </MenuItem>
      )}
      <MenuItem onClick={onDelete} variant="destructive">
        <Trash2 />
        Delete folder
      </MenuItem>
    </MenuContent>
  )
}
