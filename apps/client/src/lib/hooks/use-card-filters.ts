import { useMemo, useState } from "react"
import { useLocation, useRoute } from "wouter"
import { toggleTag } from "@doska/core"
import { useIsMobile } from "@doska/ui-kit"
import { routes } from "@/lib/routes"
import { getCardView } from "@/lib/card-view"

/** Tag and user filters for a page of cards */
export function useCardFilters(closeHref: string) {
  const [tagFilters, setTagFilters] = useState<string[]>([])
  const [userFilters, setUserFilters] = useState<string[]>([])
  const [, navigate] = useLocation()
  const [isCardOpen] = useRoute(routes.card.pattern)
  const isMobile = useIsMobile()

  // close modal if modal mode when filtering
  const filters = useMemo(() => {
    const showCards = () => {
      if (isCardOpen && (isMobile || getCardView() === "modal")) {
        navigate(closeHref)
      }
    }

    return {
      tagFilters,
      toggleTagFilter: (tag: string) => {
        showCards()
        setTagFilters((tags) => toggleTag(tags, tag))
      },
      userFilters,
      toggleUserFilter: (userId: string) => {
        showCards()
        setUserFilters((ids) =>
          ids.includes(userId)
            ? ids.filter((id) => id !== userId)
            : [...ids, userId]
        )
      },
    }
  }, [tagFilters, userFilters, isCardOpen, isMobile, navigate, closeHref])

  function clearFilters() {
    setTagFilters([])
    setUserFilters([])
  }

  return { filters, clearFilters }
}
