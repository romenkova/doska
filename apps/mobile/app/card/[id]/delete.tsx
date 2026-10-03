import { useDeleteCard, useCard, useCardDeckId } from "@doska/core"
import { ConfirmBody, SheetScreen } from "@doska/ui-kit-mobile"
import { router, useLocalSearchParams } from "expo-router"

export default function CardDeleteSheet() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data: deckId } = useCardDeckId(id ?? null)

  return id && deckId ? <Body cardId={id} deckId={deckId} /> : null
}

function Body({ cardId, deckId }: { cardId: string; deckId: string }) {
  const { data: card } = useCard(cardId)
  const { mutate: deleteCard } = useDeleteCard(deckId)
  if (!card) return null

  const title = card.title || "Untitled card"

  return (
    <SheetScreen>
      <ConfirmBody
        title="Delete card?"
        description={`"${title}" moves to the trash, where it stays restorable for 14 days.`}
        confirmLabel="Delete card"
        onConfirm={() => deleteCard(cardId)}
        // The card pane sits under these sheets and has nothing left to show.
        onClose={() => router.dismissAll()}
        onCancel={() => router.back()}
      />
    </SheetScreen>
  )
}
