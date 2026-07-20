import { Menu, MenuContent, MenuItem, MenuTrigger, cn } from "@doska/ui-kit"
import { Check } from "lucide-react"
import { COLUMN_COLORS } from "@/lib/column-colors"

interface IProps {
  color: string
  onChange: (color: string) => void
}

/** A palette dot. `hue` of null is the "no color" swatch. */
function Swatch({
  hue,
  className,
}: {
  hue: number | null
  className?: string
}) {
  return (
    <span
      className={cn(
        "size-3 shrink-0 rounded-full",
        hue === null && "border border-dashed border-muted-foreground/60",
        className
      )}
      style={
        hue === null
          ? undefined
          : {
              background: `oklch(0.72 0.14 ${hue})`,
              borderColor: `oklch(0.62 0.15 ${hue})`,
            }
      }
    />
  )
}

/** Picks a column's color from the palette, from its header on the board. */
export function ColumnColorMenu({ color, onChange }: IProps) {
  const current = COLUMN_COLORS.find((c) => c.id === color)

  return (
    <Menu>
      <MenuTrigger
        // The swatch is the only thing showing the current color, so name it.
        aria-label={`Column color: ${current?.label ?? "No color"}`}
        title="Set column color"
        className={cn(
          "flex shrink-0 cursor-pointer items-center rounded-md p-1",
          "hover:bg-muted data-popup-open:bg-muted"
        )}
      >
        <Swatch hue={current?.hue ?? null} />
      </MenuTrigger>
      <MenuContent>
        <MenuItem onClick={() => onChange("")}>
          <Swatch hue={null} />
          No color
          {!current && <Check className="ml-auto" />}
        </MenuItem>
        {COLUMN_COLORS.map((option) => (
          <MenuItem key={option.id} onClick={() => onChange(option.id)}>
            <Swatch hue={option.hue} />
            {option.label}
            {option.id === color && <Check className="ml-auto" />}
          </MenuItem>
        ))}
      </MenuContent>
    </Menu>
  )
}
