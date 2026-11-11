import { hasTag, removeFromTags, renameInTags } from "../../utils/tag-filter"
import { getBoard } from "./get-board"
import { updateCard } from "./update-card"

export async function renameTag(
  deckId: string,
  from: string,
  to: string
): Promise<void> {
  const { cards } = await getBoard(deckId)
  for (const card of cards) {
    const tags = card.tags ?? []
    if (!hasTag(tags, from)) continue
    await updateCard(card.id, { tags: renameInTags(tags, from, to) })
  }
}

export async function deleteTag(deckId: string, name: string): Promise<void> {
  const { cards } = await getBoard(deckId)
  for (const card of cards) {
    const tags = card.tags ?? []
    if (!hasTag(tags, name)) continue
    await updateCard(card.id, { tags: removeFromTags(tags, name) })
  }
}
