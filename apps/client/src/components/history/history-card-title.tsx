import { Link } from "wouter"
import { useCard, useCardDeckId } from "@doska/core"
import { ModalClose } from "@doska/ui-kit"
import { routes } from "@/lib/routes"

interface IProps {
  cardId: string
  title: string
}

export function HistoryCardTitle({ cardId, title }: IProps) {
  const { data: card } = useCard(cardId)
  const { data: deckId } = useCardDeckId(cardId)

  if (!card || card.deletedAt || !deckId)
    return <span className="font-medium text-foreground">{title}</span>

  return (
    <ModalClose
      nativeButton={false}
      render={
        <Link to={`~${routes.deck.to(deckId)}${routes.card.to(cardId)}`} />
      }
      className="font-medium text-foreground hover:underline"
    >
      {title}
    </ModalClose>
  )
}
