import type { Card } from "@doska/core/types"
import { IconButton } from "@doska/ui-kit-mobile"
import { router } from "expo-router"
import MoreHorizontal from "lucide-react-native/icons/ellipsis"
import { Pressable, Text, View } from "react-native"
import { ROUTES } from "@/lib/routes"
import { CardMeta } from "./card-meta"

interface IProps {
  card: Card
  /** The card sits in the board's done column. */
  done: boolean
}

/** A board row: title and meta. The body lives in the card sheet. */
export function BoardCard({ card, done }: IProps) {
  return (
    <Pressable
      onPress={() => router.push(ROUTES.card(card.id))}
      className="gap-2 overflow-hidden rounded-xl border border-card-ring bg-card py-2 active:opacity-70"
    >
      <View className="flex-row items-start gap-2 px-3">
        <Text className="flex-1 text-base font-sans-semibold leading-snug text-card-foreground">
          {card.title || "Untitled card"}
        </Text>
        <IconButton
          icon={MoreHorizontal}
          label={`${card.title || "Untitled card"} actions`}
          variant="plain"
          size={18}
          onPress={() => router.push(ROUTES.cardActions(card.id))}
        />
      </View>

      <View className="border-t border-muted px-3 pt-2">
        <CardMeta
          cardId={card.id}
          body={card.body}
          deadline={card.deadline}
          done={done}
        />
      </View>
    </Pressable>
  )
}
