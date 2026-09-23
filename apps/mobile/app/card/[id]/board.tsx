import { SheetScreen } from "@doska/ui-kit-mobile"
import { router, useLocalSearchParams } from "expo-router"
import { CardMoveToBoard } from "@/components/card/sheet/card-move-to-board"

export default function CardMoveToBoardSheet() {
  const { id } = useLocalSearchParams<{ id: string }>()
  if (!id) return null

  return (
    <SheetScreen>
      <CardMoveToBoard cardId={id} onDone={() => router.dismissAll()} />
    </SheetScreen>
  )
}
