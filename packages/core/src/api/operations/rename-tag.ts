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
    if (!hasTag(card.tags, from)) continue
    await updateCard(card.id, { tags: renameInTags(card.tags, from, to) })
  }
}

export async function deleteTag(deckId: string, name: string): Promise<void> {
  const { cards } = await getBoard(deckId)
  for (const card of cards) {
    if (!hasTag(card.tags, name)) continue
    await updateCard(card.id, { tags: removeFromTags(card.tags, name) })
  }
}
