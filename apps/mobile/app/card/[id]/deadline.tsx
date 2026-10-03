import { useUpdateCard, useCard } from "@doska/core"
import { SheetScreen } from "@doska/ui-kit-mobile"
import { router, useLocalSearchParams } from "expo-router"
import { DeadlineForm } from "@/components/card/sheet/deadline-form"

export default function CardDeadlineSheet() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return id ? <Body cardId={id} /> : null
}

function Body({ cardId }: { cardId: string }) {
  const { data: card } = useCard(cardId)
  const { mutate: updateCard } = useUpdateCard(cardId)
  if (!card) return null

  return (
    <SheetScreen>
      <DeadlineForm
        value={card.deadline}
        onCommit={(deadline) => updateCard({ deadline })}
        // Back to the actions sheet, where the new date shows as its hint.
        onClose={() => router.back()}
      />
    </SheetScreen>
  )
}
