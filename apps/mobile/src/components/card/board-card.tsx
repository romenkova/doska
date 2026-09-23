import type { Card } from "@doska/core/types"
import { tagsIn, taskProgress } from "@doska/markdown"
import { router } from "expo-router"
import { Pressable, View } from "react-native"
import { ROUTES } from "@/lib/routes"
import { CardMeta } from "./card-meta"
import { CardTags } from "./card-tags"
import { CardTitleRow } from "./card-title-row"
import { ImageCard } from "./image-card"
import { cardSoleImage } from "./sole-image"

interface IProps {
  card: Card
  /** The card sits in the board's done column. */
  done: boolean
  onPressTag: (tag: string) => void
}

/** A board row: title, meta and tags. The body lives in the card sheet. */
export function BoardCard({ card, done, onPressTag }: IProps) {
  const image = cardSoleImage(card)
  if (image) return <ImageCard card={card} image={image} />

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
      <CardTitleRow card={card} />

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
          <CardTags tags={tags} onPressTag={onPressTag} />
        </View>
      )}
    </Pressable>
  )
}
