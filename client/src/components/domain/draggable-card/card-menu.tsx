import {
  Button,
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui"
import { cn } from "@/lib/utils"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"

interface IProps {
  onEdit: () => void
  onDelete: () => void
}

export function CardMenu({ onEdit, onDelete }: IProps) {
  return (
    <Menu>
      <MenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Card actions"
            onClick={(e) => e.stopPropagation()}
            className={cn("-my-1 text-muted-foreground hover:text-foreground")}
          />
        }
      >
        <MoreHorizontal />
      </MenuTrigger>
      <MenuContent onClick={(e) => e.stopPropagation()}>
        <MenuItem onClick={onEdit}>
          <Pencil />
          Edit
        </MenuItem>
        <MenuSeparator />
        <MenuItem
          onClick={onDelete}
          className="text-destructive data-highlighted:bg-destructive data-highlighted:text-white"
        >
          <Trash2 />
          Delete
        </MenuItem>
      </MenuContent>
    </Menu>
  )
}
