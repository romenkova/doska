import { useMutation, useQueryClient } from "@tanstack/react-query"
import * as api from "../../api/operations"
import type { Board } from "../../types"
import { hasTag, removeFromTags, renameInTags } from "../../utils/tag-filter"
import { useIsBoardOwner } from "../board-owner"
import { keys } from "../keys"
import { useBoardPatch } from "./board-patch"

const retag = (
  board: Board,
  tag: string,
  change: (tags: string[]) => string[]
): Board => ({
  ...board,
  cards: board.cards.map((card) =>
    hasTag(card.tags, tag) ? { ...card, tags: change(card.tags) } : card
  ),
})

export function useRenameTag(deckId: string) {
  const isOwner = useIsBoardOwner(deckId)
  return useBoardPatch(
    deckId,
    async ({ from, to }: { from: string; to: string }) => {
      await api.renameTag(deckId, from, to)
      if (isOwner) await api.moveTagColor(deckId, from, to)
    },
    {
      apply: (board, { from, to }) =>
        retag(board, from, (tags) => renameInTags(tags, from, to)),
      also: () => [keys.cards, keys.digest, keys.dashboards],
    }
  )
}

export function useDeleteTag(deckId: string) {
  const isOwner = useIsBoardOwner(deckId)
  return useBoardPatch(
    deckId,
    async (name: string) => {
      await api.deleteTag(deckId, name)
      if (isOwner) await api.setTagColor(deckId, name, "")
    },
    {
      apply: (board, name) =>
        retag(board, name, (tags) => removeFromTags(tags, name)),
      also: () => [keys.cards, keys.digest, keys.dashboards],
    }
  )
}

export function useSetTagColor(deckId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ tag, color }: { tag: string; color: string }) =>
      api.setTagColor(deckId, tag, color),
    onSettled: () => qc.invalidateQueries({ queryKey: keys.dashboards }),
  })
}
