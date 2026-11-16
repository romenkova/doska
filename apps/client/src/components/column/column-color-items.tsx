import { COLUMN_COLORS, MenuItem } from "@doska/ui-kit"
import { Check } from "lucide-react"
import { ColumnSwatch } from "./column-swatch"

interface IProps {
  color: string
  onChange: (color: string) => void
}

/** The palette as menu items, for whichever menu hosts the picker. */
export function ColumnColorItems({ color, onChange }: IProps) {
  const isSet = COLUMN_COLORS.some((c) => c.id === color)

  return (
    <>
      <MenuItem onClick={() => onChange("")}>
        <ColumnSwatch color="" />
        No color
        {!isSet && <Check className="ml-auto" />}
      </MenuItem>
      {COLUMN_COLORS.map((option) => (
        <MenuItem key={option.id} onClick={() => onChange(option.id)}>
          <ColumnSwatch color={option.id} />
          {option.label}
          {option.id === color && <Check className="ml-auto" />}
        </MenuItem>
      ))}
    </>
  )
}
