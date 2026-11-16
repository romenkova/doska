import { Button, Menu, MenuTrigger, cn } from "@doska/ui-kit"
import { MoreVertical } from "lucide-react"
import { type BoardActions, BoardMenuItems } from "./board-menu-items"

export function BoardMenu(actions: BoardActions) {
  return (
    <Menu>
      <MenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Board actions"
            tooltip={false}
            className={cn(
              "absolute top-1.5 right-px text-muted-foreground opacity-0 max-md:opacity-100",
              "group-hover/menu-item:opacity-100 focus-visible:opacity-100 data-popup-open:opacity-100"
            )}
          />
        }
      >
        <MoreVertical />
      </MenuTrigger>
      <BoardMenuItems {...actions} />
    </Menu>
  )
}
