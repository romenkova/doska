import type { DigestFilter } from "@doska/core/operations"
import { Pressable, Text, View } from "react-native"

const FILTERS: { id: DigestFilter; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "Upcoming" },
]

interface IProps {
  value: DigestFilter
  onChange: (filter: DigestFilter) => void
}

/** The digest's two ranges, as the iOS segmented control the web draws as two
 * header buttons. */
export function UpcomingFilter({ value, onChange }: IProps) {
  return (
    <View className="mx-3 mt-3 flex-row rounded-lg bg-muted p-0.5">
      {FILTERS.map((filter) => {
        const selected = filter.id === value

        return (
          <Pressable
            key={filter.id}
            onPress={() => onChange(filter.id)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            className={
              selected
                ? "flex-1 items-center rounded-[6px] bg-card py-1.5"
                : "flex-1 items-center rounded-[6px] py-1.5 active:opacity-70"
            }
          >
            <Text
              className={
                selected
                  ? "text-[13px] font-sans-medium text-card-foreground"
                  : "text-[13px] font-sans-medium text-muted-foreground"
              }
            >
              {filter.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}
