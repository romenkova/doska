import { ChevronDown } from "lucide-react"
import type { Column, Dashboard } from "@doska/core/types"
import { Menu, MenuContent, MenuItem, MenuTrigger, cn } from "@doska/ui-kit"

interface IProps {
  dashboards: Dashboard[]
  board: Dashboard | undefined
  column: Column | undefined
  onPick: (id: string) => void
}

export function BoardPicker({ dashboards, board, column, onPick }: IProps) {
  return (
    <Menu>
      <MenuTrigger
        data-no-drag
        className={cn(
          "flex items-center gap-1 rounded-md px-1.5 py-1 outline-none",
          "hover:bg-muted hover:text-foreground focus-visible:bg-muted"
        )}
      >
        <span className="truncate">
          {board ? board.title : "No boards"}
          {column && (
            <span className="text-muted-foreground/70">
              {" · "}
              {column.title}
            </span>
          )}
        </span>
        <ChevronDown className="size-3.5 shrink-0" />
      </MenuTrigger>
      <MenuContent align="start">
        {dashboards.map((d) => (
          <MenuItem key={d.id} onClick={() => onPick(d.id)}>
            {d.title}
          </MenuItem>
        ))}
      </MenuContent>
    </Menu>
  )
}
