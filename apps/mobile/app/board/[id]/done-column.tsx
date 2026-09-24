import { SheetScreen } from "@doska/ui-kit-mobile"
import { router, useLocalSearchParams } from "expo-router"
import { DoneColumnHelp } from "@/components/upcoming/done-column-help"

export default function BoardDoneColumnSheet() {
  const { id } = useLocalSearchParams<{ id: string }>()
  if (!id) return null

  return (
    <SheetScreen>
      <DoneColumnHelp boardId={id} onClose={() => router.back()} />
    </SheetScreen>
  )
}
