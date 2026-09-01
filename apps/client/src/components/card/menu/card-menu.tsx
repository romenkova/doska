import {
  Button,
  ContextMenu,
  ContextMenuTrigger,
  Menu,
  MenuTrigger,
  useIsMobile,
  type MenuActions,
} from "@doska/ui-kit"
import { MoreHorizontal } from "lucide-react"
import { useRef, type ReactNode } from "react"
import { CardMenuItems } from "./menu-items"

interface IProps {
  cardId: string
  onEdit: () => void
}

export function CardMenu({ cardId, onEdit }: IProps) {
  const actionsRef = useRef<MenuActions>(null)

  return (
    <Menu actionsRef={actionsRef}>
      <MenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Card actions"
            onClick={(e) => e.stopPropagation()}
            tooltip={false}
          />
        }
      >
        <MoreHorizontal />
      </MenuTrigger>
      <CardMenuItems
        cardId={cardId}
        onEdit={onEdit}
        closeMenu={() => actionsRef.current?.close()}
      />
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
  const actionsRef = useRef<MenuActions>(null)

  if (!isEnabled || isMobile) return children

  return (
    <ContextMenu actionsRef={actionsRef}>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>
      <CardMenuItems
        align="start"
        cardId={cardId}
        onEdit={onEdit}
        closeMenu={() => actionsRef.current?.close()}
      />
    </ContextMenu>
  )
}
