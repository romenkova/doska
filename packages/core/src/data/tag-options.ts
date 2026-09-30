import { useMemo } from "react"
import type { PrefixOption } from "@doska/markdown/core"
import { useBoard } from "./queries"

/**
 * Every tag on the board, most used first, for the `#` menu
 */
export function useTagOptions(deckId: string): PrefixOption[] {
  const { data: board } = useBoard(deckId)

  return useMemo(() => {
    const counts = new Map<string, { name: string; count: number }>()

    for (const card of board?.cards ?? []) {
      for (const name of card.tags ?? []) {
        const key = name.toLowerCase()
        const entry = counts.get(key)
        if (entry) entry.count += 1
        else counts.set(key, { name, count: 1 })
      }
    }

    return [...counts.values()]
      .sort((a, b) => b.count - a.count)
      .map(({ name, count }) => ({
        name,
        hint: count === 1 ? "1 card" : `${count} cards`,
      }))
  }, [board])
}
