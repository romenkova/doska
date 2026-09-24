import type { Card } from "@doska/core/types"
import { Text, View } from "react-native"
import { CardActionsButton } from "./card-actions-button"

export function CardTitleRow({ card }: { card: Card }) {
  return (
    <View className="flex-row items-start gap-2 px-3">
      <Text className="flex-1 text-base font-sans-semibold leading-snug text-card-foreground">
        {card.title || "Untitled card"}
      </Text>
      <View className="-mb-2 -mt-1">
        <CardActionsButton card={card} />
      </View>
    </View>
  )
}
