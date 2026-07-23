import { useMemo } from "react"
import { DeckView } from "@/components"
import { useActiveDashboard } from "@/lib/hooks"
import { routes } from "@/lib/routes"
import { AppShell } from "./app-shell"

interface IProps {
  deckId: string
}

/** One board, at `/d/:id`. */
export function BoardPage({ deckId }: IProps) {
  const { dashboard } = useActiveDashboard(deckId)

  const deck = useMemo(
    () => ({ id: dashboard.id, prefix: dashboard.prefix ?? "" }),
    [dashboard.id, dashboard.prefix]
  )

  return (
    <AppShell
      deck={deck}
      cardCloseHref={`~${routes.deck.to(dashboard.id)}`}
    >
      <DeckView dashboard={dashboard} />
    </AppShell>
  )
}
