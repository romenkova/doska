import { Button, Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui"
import { cn } from "@/lib/utils"
import { MoreHorizontal, Trash2 } from "lucide-react"

interface IProps {
  onDelete: () => void
}

export function DashboardMenu({ onDelete }: IProps) {
  return (
    <Menu>
      <MenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Dashboard actions"
            className={cn(
              "absolute top-1/2 right-1 size-6 -translate-y-1/2 text-sidebar-foreground/70",
              "opacity-0 transition-opacity hover:text-sidebar-foreground",
              "group-hover/menu-item:opacity-100 focus-visible:opacity-100",
            )}
          />
        }
      >
        <MoreHorizontal />
      </MenuTrigger>
      <MenuContent onClick={(e) => e.stopPropagation()}>
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
