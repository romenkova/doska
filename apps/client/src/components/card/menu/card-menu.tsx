import {
  Button,
  ContextMenu,
  ContextMenuTrigger,
  Menu,
  MenuTrigger,
} from "@doska/ui-kit"
import { MoreHorizontal } from "lucide-react"
import type { ReactNode } from "react"
import type { Column } from "@/lib/types"
import { CardMenuItems } from "./menu-items"

interface IProps {
  onEdit: () => void
  onDelete: () => void
  onAddDeadline?: () => void
}

interface IMove {
  columns: Column[]
  currentColumnId: string
  onMoveToColumn: (columnId: string) => void
}

export function CardMenu({
  onEdit,
  onDelete,
  onAddDeadline,
  ...move
}: IProps & IMove) {
  return (
    <Menu>
      <MenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Card actions"
            onClick={(e) => e.stopPropagation()}
          />
        }
      >
        <MoreHorizontal />
      </MenuTrigger>
      <CardMenuItems
        onEdit={onEdit}
        onDelete={onDelete}
        onAddDeadline={onAddDeadline}
        move={move}
      />
    </Menu>
  )
}

export function CardContextMenu({
  children,
  onEdit,
  onDelete,
  onAddDeadline,
  ...move
}: IProps & IMove & { children: ReactNode }) {
  return (
    <ContextMenu>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>
      <CardMenuItems
        align="start"
        onEdit={onEdit}
        onDelete={onDelete}
        onAddDeadline={onAddDeadline}
        move={move}
      />
    </ContextMenu>
  )
}
