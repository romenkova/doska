import { COLUMN_COLORS } from "@doska/tokens"
import { Pressable, ScrollView, Text, View } from "react-native"
import { ColumnSwatch } from "./column-swatch"

interface IProps {
  color: string
  onChange: (color: string) => void
}

/** Picks a column's color. The web nests this in a submenu; a sheet has no
 * submenus, so the swatches lie out in a row instead. */
export function ColumnColorRow({ color, onChange }: IProps) {
  return (
    <View>
      <Text className="px-3 pb-1 text-[13px] font-sans-medium text-muted-foreground">
        Color
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="items-center gap-2 px-3 py-1"
      >
        {/* "No color" leads, the way it does in the web menu. */}
        {[{ id: "", label: "No color" }, ...COLUMN_COLORS].map((option) => (
          <Pressable
            key={option.id || "none"}
            onPress={() => onChange(option.id)}
            accessibilityRole="button"
            accessibilityLabel={option.label}
            accessibilityState={{ selected: option.id === color }}
            className={
              option.id === color
                ? "size-11 items-center justify-center rounded-full bg-secondary"
                : "size-11 items-center justify-center rounded-full active:bg-muted"
            }
          >
            <ColumnSwatch color={option.id} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  )
}
