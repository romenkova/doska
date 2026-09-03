import { useEffect, useMemo } from "react"
import { useRoute } from "wouter"
import { DigestView } from "@/components/digest/digest-view"
import { sync } from "@doska/core/sync"
import { useCardDeckId } from "@doska/core/queries"
import { routes } from "@/lib/routes"
import { AppShell } from "./app-shell"

/** Deadlined cards from every board, at `/digest`. */
export function DigestPage() {
  useEffect(() => {
    sync.setActiveBoard(null)
  }, [])

  const [, params] = useRoute(routes.card.pattern)
  const { data: cardDeckId } = useCardDeckId(params?.id ?? null)

  const deck = useMemo(
    () => ({ id: cardDeckId ?? "", sort: [] }),
    [cardDeckId]
  )

  return (
    <AppShell deck={deck} cardCloseHref={`~${routes.digest()}`}>
      <DigestView />
    </AppShell>
  )
}
