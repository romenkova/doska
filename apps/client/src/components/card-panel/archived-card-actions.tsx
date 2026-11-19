import { Button } from "@doska/ui-kit"
import { ArrowUpFromLine, Trash2 } from "lucide-react"
import { useDeleteCard } from "@doska/core"
import { useCardDeleteToast } from "@/components/toasts/card-delete/use-card-delete-toast"
import { useDeck } from "@/providers/deck/deck-context"

export function ArchivedCardActions({
  cardId,
  title,
  onRestore,
}: {
  cardId: string
  title: string
  onRestore: () => void
}) {
  const { id: deckId } = useDeck()
  const { mutate: deleteCard } = useDeleteCard(deckId)
  const { showCardDeleteToast } = useCardDeleteToast()

  return (
    <span className="flex items-center" onClick={(e) => e.stopPropagation()}>
      <Button variant="ghost" size="sm" onClick={onRestore}>
        <ArrowUpFromLine />
        Restore
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Delete"
        className="hover:text-destructive"
        onClick={() =>
          deleteCard(cardId, {
            onSuccess: () =>
              showCardDeleteToast(cardId, {
                title: title.trim() || "Untitled card",
              }),
          })
        }
      >
        <Trash2 />
      </Button>
    </span>
  )
}
