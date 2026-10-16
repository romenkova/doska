import { useEffect, useMemo } from "react"
import { useRoute } from "wouter"
import { DigestView } from "@/components/digest/digest-view"
import { sync, useCardDeckId } from "@doska/core"
import { useCardFilters } from "@/lib/hooks"
import { routes } from "@/lib/routes"
import { AppShell } from "./app-shell"

/** Deadlined cards from every board, at `/digest`. */
export function DigestPage() {
  useEffect(() => {
    sync.setActiveBoard(null)
  }, [])

  const [, params] = useRoute(routes.card.pattern)
  const { data: cardDeckId } = useCardDeckId(params?.id ?? null)
  const closeHref = `~${routes.digest()}`
  const { filters } = useCardFilters(closeHref)

  const deck = useMemo(
    () => ({ id: cardDeckId ?? "", sort: [], ...filters }),
    [cardDeckId, filters]
  )

  return (
    <AppShell deck={deck} cardCloseHref={closeHref}>
      <DigestView />
    </AppShell>
  )
}
