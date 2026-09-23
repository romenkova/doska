import type { Card } from "@doska/core/types"
import { tagsIn, taskProgress } from "@doska/markdown"
import { IconButton } from "@doska/ui-kit-mobile"
import { router } from "expo-router"
import MoreHorizontal from "lucide-react-native/icons/ellipsis"
import { Pressable, Text, View } from "react-native"
import { ROUTES } from "@/lib/routes"
import { CardMeta } from "./card-meta"
import { CardTags } from "./card-tags"

interface IProps {
  card: Card
  /** The card sits in the board's done column. */
  done: boolean
}

/** A board row: title, meta and tags. The body lives in the card sheet. */
export function BoardCard({ card, done }: IProps) {
  const tags = tagsIn(card.body)
  const hasMeta =
    taskProgress(card.body).total > 0 ||
    !!card.deadline ||
    !!card.priority ||
    !!card.bodyConflict

  return (
    <Pressable
      onPress={() => router.push(ROUTES.card(card.id))}
      className="gap-2 overflow-hidden rounded-xl border border-card-ring bg-card py-2 active:opacity-70"
    >
      <View className="flex-row items-start gap-2 px-3">
        <Text className="flex-1 text-base font-sans-semibold leading-snug text-card-foreground">
          {card.title || "Untitled card"}
        </Text>
        {/* The button's padding stays out of the row's height, so a lone
            title isn't pushed off-center; the icon sits on the first line. */}
        <View className="-mb-2 -mt-1">
          <IconButton
            icon={MoreHorizontal}
            label={`${card.title || "Untitled card"} actions`}
            variant="plain"
            size={18}
            onPress={() => router.push(ROUTES.cardActions(card.id))}
          />
        </View>
      </View>

      {hasMeta && (
        <View className="border-t border-muted px-3 pt-2">
          <CardMeta
            cardId={card.id}
            body={card.body}
            deadline={card.deadline}
            priority={card.priority}
            done={done}
            conflict={!!card.bodyConflict}
          />
        </View>
      )}
      {tags.length > 0 && (
        <View className="border-t border-muted px-3 pt-2">
          <CardTags tags={tags} />
        </View>
      )}
    </Pressable>
  )
}
