import {
  Button,
  ContextMenu,
  ContextMenuTrigger,
  Menu,
  MenuTrigger,
  useIsMobile,
} from "@doska/ui-kit"
import { MoreHorizontal } from "lucide-react"
import type { ReactNode } from "react"
import { CardMenuItems } from "./menu-items"

interface IProps {
  cardId: string
  onEdit: () => void
}

export function CardMenu({ cardId, onEdit }: IProps) {
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
      <CardMenuItems cardId={cardId} onEdit={onEdit} />
    </Menu>
  )
}

export function CardContextMenu({
  children,
  isEnabled = true,
  cardId,
  onEdit,
}: IProps & { children: ReactNode; isEnabled?: boolean }) {
  const isMobile = useIsMobile()

  if (!isEnabled || isMobile) return children

  return (
    <ContextMenu>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>
      <CardMenuItems align="start" cardId={cardId} onEdit={onEdit} />
    </ContextMenu>
  )
}
