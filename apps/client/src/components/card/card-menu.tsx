import {
  Button,
  ContextMenu,
  ContextMenuTrigger,
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from "@doska/ui-kit"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import type { ReactNode } from "react"

interface IProps {
  onEdit: () => void
  onDelete: () => void
}

function CardMenuItems({
  onEdit,
  onDelete,
  align = "end",
}: IProps & { align?: "start" | "center" | "end" }) {
  return (
    <MenuContent align={align} onClick={(e) => e.stopPropagation()}>
      <MenuItem onClick={onEdit}>
        <Pencil />
        Edit
      </MenuItem>
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
            className="-my-1 text-muted-foreground hover:text-foreground"
          />
        }
      >
        <MoreHorizontal />
      </MenuTrigger>
      <CardMenuItems onEdit={onEdit} onDelete={onDelete} />
    </Menu>
  )
}

export function CardContextMenu({
  children,
  onEdit,
  onDelete,
}: IProps & { children: ReactNode }) {
  return (
    <ContextMenu>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>
      <CardMenuItems align="start" onEdit={onEdit} onDelete={onDelete} />
    </ContextMenu>
  )
}
