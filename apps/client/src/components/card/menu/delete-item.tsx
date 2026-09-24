import { MenuItem } from "@doska/ui-kit"
import { Trash2 } from "lucide-react"
import { useParams } from "wouter"
import { useDeleteCard } from "@doska/core/mutations"
import { useCard } from "@doska/core/queries"
import { useCardDeleteToast } from "@/components/toasts/card-delete/use-card-delete-toast"
import { routes } from "@/lib/routes"

export function DeleteItem({ cardId }: { cardId: string }) {
  const { id: deckId } = useParams<typeof routes.deck.pattern>()
  const { mutateAsync: deleteCard } = useDeleteCard(deckId)
  const { data: card } = useCard(cardId)
  const { showCardDeleteToast } = useCardDeleteToast()

  return (
    <MenuItem
      onClick={async () => {
        await deleteCard(cardId)
        showCardDeleteToast(cardId, {
          title: card?.title?.trim() || "Card",
        })
      }}
      className="ml-auto data-highlighted:text-destructive"
    >
      <Trash2 />
      Delete
    </MenuItem>
  )
}
