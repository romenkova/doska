import { Menu, MenuContent, MenuTrigger } from "@doska/ui-kit"
import { ColumnColorItems } from "../column/column-color-items"
import { ColumnSwatch } from "../column/column-swatch"

interface IProps {
  tag: string
  color: string
  onChange: (color: string) => void
}

export function TagColorMenu({ tag, color, onChange }: IProps) {
  return (
    <Menu>
      <MenuTrigger
        aria-label={`Color for #${tag}`}
        className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md hover:bg-muted"
      >
        <ColumnSwatch color={color} />
      </MenuTrigger>
      <MenuContent align="start">
        <ColumnColorItems color={color} onChange={onChange} />
      </MenuContent>
    </Menu>
  )
}
