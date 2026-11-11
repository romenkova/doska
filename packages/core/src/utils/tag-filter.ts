import type { Card } from "../types"

export const sameTag = (a: string, b: string) =>
  a.toLowerCase() === b.toLowerCase()

export function filterByTags(cards: Card[], tags: string[] = []) {
  if (tags.length === 0) return cards
  return cards.filter((card) => {
    const names = card.tags ?? []
    return tags.every((tag) => names.some((name) => sameTag(name, tag)))
  })
}

/** Cards tagged with any of `userIds`, unlike tags which must all match. */
export function filterByUsers(cards: Card[], userIds: string[] = []) {
  if (userIds.length === 0) return cards
  return cards.filter((card) =>
    (card.users ?? []).some((id) => userIds.includes(id))
  )
}

export function toggleTag(tags: string[], tag: string) {
  if (tags.some((t) => sameTag(t, tag)))
    return tags.filter((t) => !sameTag(t, tag))
  return [...tags, tag]
}

export function hasTag(tags: string[], tag: string) {
  return tags.some((t) => sameTag(t, tag))
}

/** Renaming onto a tag already in the list merges the two. */
export function renameInTags(tags: string[], from: string, to: string) {
  const renamed: string[] = []
  for (const tag of tags) {
    const next = sameTag(tag, from) ? to : tag
    if (!hasTag(renamed, next)) renamed.push(next)
  }
  return renamed
}

export function removeFromTags(tags: string[], name: string) {
  return tags.filter((tag) => !sameTag(tag, name))
}
