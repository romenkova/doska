import { View } from "react-native"
import { columnSwatch } from "@doska/tokens"

/** A column's color as a dot; `""` is the dashed "no color" outline. */
export function ColumnSwatch({ color }: { color: string }) {
  const swatch = columnSwatch(color)

  if (!swatch) {
    return (
      <View className="size-3 shrink-0 rounded-full border border-dashed border-muted-foreground" />
    )
  }

  return (
    <View
      className="size-3 shrink-0 rounded-full border"
      style={{ backgroundColor: swatch.dot, borderColor: swatch.ring }}
    />
  )
}
