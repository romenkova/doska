import { useLocation, useRoute } from "wouter"
import { boardDigest, groupBoardCards, type Board } from "@doska/core"
import { routes } from "@/lib/routes"
import { DeckRows } from "./deck-rows"

interface IProps {
  board: Board
  title: string
}

/**
 * Groups the open board's cards for the row view
 */
export function DeckRowsView({ board, title }: IProps) {
  const [, navigate] = useLocation()
  const [, params] = useRoute(routes.card.pattern)

  return (
    <DeckRows
      groups={groupBoardCards(boardDigest(board, title))}
      openCardId={params?.id ?? null}
      onOpenCard={(entry) => navigate(routes.card.to(entry.card.id))}
    />
  )
}
