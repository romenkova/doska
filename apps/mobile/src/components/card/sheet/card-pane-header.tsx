import { useCardCol } from "@doska/core/queries"
import { Chip } from "@doska/ui-kit-mobile"
import { router } from "expo-router"
import { Pressable, Text, View } from "react-native"
import { CardMeta } from "@/components/card/card-meta"
import { ColumnSwatch } from "@/components/column/column-swatch"
import { ROUTES } from "@/lib/routes"

interface IProps {
  cardId: string
  /** The unsaved body, so task progress tracks it live. */
  body: string
  deadline: string | null
  priority: string
}

/** The card's meta row, standing in for a navigation bar. The system draws the
 * sheet's grabber over the top ~16pt of this, so the row starts below it. */
export function CardPaneHeader({ cardId, body, deadline, priority }: IProps) {
  const { data: column } = useCardCol(cardId)

  return (
    <View className="flex-row items-center gap-4 border-b border-muted px-4 pb-2.5 pt-5">
      <CardMeta
        cardId={cardId}
        body={body}
        deadline={deadline}
        priority={priority}
        done={column?.done ?? false}
      />
      {column ? (
        <Pressable
          onPress={() => router.push(ROUTES.cardMove(cardId))}
          accessibilityRole="button"
          accessibilityLabel={`Column: ${column.title}`}
          hitSlop={6}
        >
          <Chip className="bg-muted">
            <ColumnSwatch color={column.color} />
            <Text className="text-xs font-sans-medium uppercase text-muted-foreground">
              {column.title}
            </Text>
          </Chip>
        </Pressable>
      ) : null}
    </View>
  )
}
