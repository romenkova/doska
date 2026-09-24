import { tagsIn } from "@doska/markdown"
import type { Card } from "@doska/core/types"

const sameTag = (a: string, b: string) => a.toLowerCase() === b.toLowerCase()

export function filterByTags(cards: Card[], tags: string[] = []) {
  if (tags.length === 0) return cards
  return cards.filter((card) => {
    const names = tagsIn(card.body)
    return tags.every((tag) => names.some((name) => sameTag(name, tag)))
  })
}

export function toggleTag(tags: string[], tag: string) {
  if (tags.some((t) => sameTag(t, tag)))
    return tags.filter((t) => !sameTag(t, tag))
  return [...tags, tag]
}
