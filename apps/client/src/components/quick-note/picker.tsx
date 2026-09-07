import type { ReactNode } from "react"
import { ChevronDown } from "lucide-react"
import { Menu, MenuContent, MenuTrigger, cn } from "@doska/ui-kit"

interface IProps {
  label: string
  children: ReactNode
}

export function Picker({ label, children }: IProps) {
  return (
    <Menu>
      <MenuTrigger
        data-no-drag
        className={cn(
          "flex min-w-0 items-center gap-1 rounded-md px-1.5 py-1 outline-none",
          "hover:bg-muted hover:text-foreground focus-visible:bg-muted"
        )}
      >
        <span className="truncate">{label}</span>
        <ChevronDown className="size-3.5 shrink-0" />
      </MenuTrigger>
      <MenuContent align="start">{children}</MenuContent>
    </Menu>
  )
}
