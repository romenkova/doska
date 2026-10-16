import { useMemo, useState } from "react"
import { DeckView } from "@/components"
import { useActiveDashboard, useCardFilters } from "@/lib/hooks"
import { routes } from "@/lib/routes"
import { AppShell } from "./app-shell"

interface IProps {
  deckId: string
}

/** One board, at `/d/:id`. */
export function BoardPage({ deckId }: IProps) {
  const { dashboard } = useActiveDashboard(deckId)
  const [lastDeckId, setLastDeckId] = useState(deckId)
  const closeHref = `~${routes.deck.to(dashboard.id)}`
  const { filters, clearFilters } = useCardFilters(closeHref)

  if (deckId !== lastDeckId) {
    setLastDeckId(deckId)
    clearFilters()
  }

  const deck = useMemo(
    () => ({ id: dashboard.id, sort: dashboard.sort ?? [], ...filters }),
    [dashboard.id, dashboard.sort, filters]
  )

  return (
    <AppShell deck={deck} cardCloseHref={closeHref}>
      <DeckView key={dashboard.id} dashboard={dashboard} />
    </AppShell>
  )
}
