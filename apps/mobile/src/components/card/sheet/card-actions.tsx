import { useCard, useCardCol } from "@doska/core/queries"
import { Separator, SheetItem } from "@doska/ui-kit-mobile"
import { formatDeadline } from "@doska/core/utils"
import { PRIORITIES } from "@doska/tokens/priority"
import { router } from "expo-router"
import ArrowRightLeft from "lucide-react-native/icons/arrow-right-left"
import CalendarClock from "lucide-react-native/icons/calendar-clock"
import Flag from "lucide-react-native/icons/flag"
import Trash2 from "lucide-react-native/icons/trash-2"
import { View } from "react-native"
import { ROUTES } from "@/lib/routes"

/** A card's own actions: the web's card menu, plus the deadline and column
 * controls it puts in the card panel's header. */
export function CardActions({ cardId }: { cardId: string }) {
  const { data: card } = useCard(cardId)
  const { data: column } = useCardCol(cardId)
  if (!card) return null

  return (
    <View>
      <SheetItem
        icon={CalendarClock}
        label="Due date"
        trailing={card.deadline ? formatDeadline(card.deadline) : "None"}
        onPress={() => router.push(ROUTES.cardDeadline(cardId))}
      />
      <SheetItem
        icon={Flag}
        label="Priority"
        trailing={
          PRIORITIES.find((p) => p.id === card.priority)?.label ?? "None"
        }
        onPress={() => router.push(ROUTES.cardPriority(cardId))}
      />
      <SheetItem
        icon={ArrowRightLeft}
        label="Move to column"
        trailing={column?.title ?? ""}
        onPress={() => router.push(ROUTES.cardMove(cardId))}
      />
      <Separator className="my-1" />
      <SheetItem
        icon={Trash2}
        label="Delete card"
        destructive
        onPress={() => router.push(ROUTES.cardDelete(cardId))}
      />
    </View>
  )
}
