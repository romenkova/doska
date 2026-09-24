import type { Card } from "@doska/core/types"
import type { SoleImage } from "@doska/markdown"
import { cn } from "@doska/ui-kit-mobile"
import { router } from "expo-router"
import { Pressable, View } from "react-native"
import { ROUTES } from "@/lib/routes"
import { CardActionsButton } from "./card-actions-button"
import { CardImage } from "./card-image"
import { CardTitleRow } from "./card-title-row"

interface IProps {
  card: Card
  image: SoleImage
}

/** A card whose whole content is one image, drawn edge to edge. */
export function ImageCard({ card, image }: IProps) {
  return (
    <Pressable
      onPress={() => router.push(ROUTES.card(card.id))}
      className={cn(
        "gap-2 overflow-hidden rounded-xl border border-card-ring bg-card active:opacity-70",
        card.title && "pt-2"
      )}
    >
      {card.title ? (
        <CardTitleRow card={card} />
      ) : (
        <View className="absolute right-1 top-1 z-10 rounded-md bg-card">
          <CardActionsButton card={card} />
        </View>
      )}
      <CardImage image={image} />
    </Pressable>
  )
}
