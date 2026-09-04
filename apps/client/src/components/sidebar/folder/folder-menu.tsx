import { Button, Menu, MenuContent, MenuItem, MenuTrigger } from "@doska/ui-kit"
import { MoreVertical, Pencil, Trash2 } from "lucide-react"

interface IProps {
  onRename: () => void
  onDelete: () => void
}

export function FolderMenu({ onRename, onDelete }: IProps) {
  return (
    <Menu>
      <MenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Folder actions"
            tooltip={false}
            className={
              "absolute top-0.5 right-px text-muted-foreground opacity-0 " +
              "group-hover/menu-item:opacity-100 focus-visible:opacity-100 data-popup-open:opacity-100"
            }
          />
        }
      >
        <MoreVertical />
      </MenuTrigger>
      <MenuContent>
        <MenuItem onClick={onRename}>
          <Pencil />
          Rename
        </MenuItem>
        <MenuItem onClick={onDelete} className="text-destructive">
          <Trash2 />
          Delete folder
        </MenuItem>
      </MenuContent>
    </Menu>
  )
}
