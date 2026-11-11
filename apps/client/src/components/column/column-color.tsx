import { MenuContent, MenuSub, MenuSubTrigger } from "@doska/ui-kit"
import { ColumnColorItems } from "./column-color-items"
import { ColumnSwatch } from "./column-swatch"

interface IProps {
  color: string
  onChange: (color: string) => void
}

/** Picks a column's color, nested inside the column's actions menu. */
export function ColumnColorSubmenu({ color, onChange }: IProps) {
  return (
    <MenuSub>
      <MenuSubTrigger>
        <ColumnSwatch color={color} />
        Color
      </MenuSubTrigger>
      <MenuContent align="start">
        <ColumnColorItems color={color} onChange={onChange} />
      </MenuContent>
    </MenuSub>
  )
}
