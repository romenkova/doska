import { useMemo, useState } from "react"
import { DeckView } from "@/components"
import { useActiveDashboard } from "@/lib/hooks"
import { routes } from "@/lib/routes"
import { toggleTag } from "@/lib/tag-filter"
import { AppShell } from "./app-shell"

interface IProps {
  deckId: string
}

/** One board, at `/d/:id`. */
export function BoardPage({ deckId }: IProps) {
  const { dashboard } = useActiveDashboard(deckId)
  const [tagFilters, setTagFilters] = useState<string[]>([])
  const [lastDeckId, setLastDeckId] = useState(deckId)

  if (deckId !== lastDeckId) {
    setLastDeckId(deckId)
    setTagFilters([])
  }

  const deck = useMemo(
    () => ({
      id: dashboard.id,
      sort: dashboard.sort ?? [],
      tagFilters,
      toggleTagFilter: (tag: string) =>
        setTagFilters((tags) => toggleTag(tags, tag)),
    }),
    [dashboard.id, dashboard.sort, tagFilters]
  )

  return (
    <AppShell deck={deck} cardCloseHref={`~${routes.deck.to(dashboard.id)}`}>
      <DeckView key={dashboard.id} dashboard={dashboard} />
    </AppShell>
  )
}
