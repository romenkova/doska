import { SheetScreen } from "@doska/ui-kit-mobile"
import { router, useLocalSearchParams } from "expo-router"
import { CardPriority } from "@/components/card/sheet/card-priority"

export default function CardPrioritySheet() {
  const { id } = useLocalSearchParams<{ id: string }>()
  if (!id) return null

  return (
    <SheetScreen>
      {/* Back to the actions sheet, where the new level shows as its hint. */}
      <CardPriority cardId={id} onDone={() => router.back()} />
    </SheetScreen>
  )
}
