import { Text, View } from "react-native"
import type { GroupSection } from "@/components/upcoming/sections"

const TITLE = {
  overdue: "text-base font-sans-bold text-destructive",
  undated: "text-base font-sans-bold text-muted-foreground",
  date: "text-base font-sans-bold text-foreground",
}

export function GroupHeading({ section }: { section: GroupSection }) {
  return (
    <View className="flex-row items-baseline gap-2 pt-3">
      <Text className={TITLE[section.kind]}>{section.title}</Text>
      {section.kind === "date" ? (
        <>
          <Text className="text-[13px] text-muted-foreground">
            {section.day}
          </Text>
          <Text className="text-[13px] text-muted-foreground">
            {section.countdown}
          </Text>
        </>
      ) : null}
    </View>
  )
}
