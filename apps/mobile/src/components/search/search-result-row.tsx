import { cardDisplayId } from "@doska/contract/card-id"
import type { SearchHit } from "@doska/core/search"
import { Pressable, Text, View } from "react-native"
import { ColumnSwatch } from "@/components/column/column-swatch"
import { Segments } from "./segments"

interface IProps {
  hit: SearchHit
  onPress: () => void
}

export function SearchResultRow({ hit, onPress }: IProps) {
  const displayId = cardDisplayId(hit.card.number)

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="gap-1 rounded-xl border border-border bg-card p-3 active:opacity-70"
    >
      <Text
        numberOfLines={1}
        className="text-[15px] font-sans-medium text-card-foreground"
      >
        <Segments segments={hit.title} />
      </Text>

      {hit.snippet && (
        <Text
          numberOfLines={1}
          className="text-[13px] font-sans text-muted-foreground"
        >
          <Segments segments={hit.snippet} />
        </Text>
      )}

      <View className="flex-row items-center gap-2">
        {displayId && (
          <Text className="font-mono text-xs text-muted-foreground">
            #{displayId}
          </Text>
        )}
        {hit.column && (
          <View className="min-w-0 flex-row items-center gap-1.5">
            <ColumnSwatch color={hit.column.color} />
            <Text
              numberOfLines={1}
              className="shrink text-xs font-sans text-muted-foreground"
            >
              {hit.column.title}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  )
}
