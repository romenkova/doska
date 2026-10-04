import { useMemo, useState } from "react"
import { toggleTag } from "@doska/core"
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
  const [tagFilters, setTagFilters] = useState<string[]>([])
  const [userFilters, setUserFilters] = useState<string[]>([])
  const [lastDeckId, setLastDeckId] = useState(deckId)

  if (deckId !== lastDeckId) {
    setLastDeckId(deckId)
    setTagFilters([])
    setUserFilters([])
  }

  const deck = useMemo(
    () => ({
      id: dashboard.id,
      sort: dashboard.sort ?? [],
      tagFilters,
      toggleTagFilter: (tag: string) =>
        setTagFilters((tags) => toggleTag(tags, tag)),
      userFilters,
      toggleUserFilter: (userId: string) =>
        setUserFilters((ids) =>
          ids.includes(userId)
            ? ids.filter((id) => id !== userId)
            : [...ids, userId]
        ),
    }),
    [dashboard.id, dashboard.sort, tagFilters, userFilters]
  )

  return (
    <AppShell deck={deck} cardCloseHref={`~${routes.deck.to(dashboard.id)}`}>
      <DeckView key={dashboard.id} dashboard={dashboard} />
    </AppShell>
  )
}
