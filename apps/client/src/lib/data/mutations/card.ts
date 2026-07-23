import { useMutation, useQueryClient } from "@tanstack/react-query"
import * as api from "@/lib/api/operations"
import type { Board, Card } from "@/lib/types"
import { keys } from "../keys"
import { flushSyncUpdate } from "./flush-sync"

export function useCreateCard(deckId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (columnId: string) => api.createCard(columnId),
    onSettled: () => qc.invalidateQueries({ queryKey: keys.board(deckId) }),
  })
}

export function useDeleteCard(deckId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteCard(deckId, id),
    onSettled: (_data, _error, id) => {
      qc.invalidateQueries({ queryKey: keys.board(deckId) })
      qc.invalidateQueries({ queryKey: keys.card(id) })
      qc.invalidateQueries({ queryKey: keys.digest })
    },
  })
}

export type CardPatch = Partial<
  Pick<Card, "title" | "body" | "deadline" | "attachments">
>

export function useUpdateCard(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (patch: CardPatch) => api.updateCard(id, patch),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: keys.card(id) })
      qc.invalidateQueries({ queryKey: keys.digest })
    },
  })
}

/**
 * {@link useUpdateCard} with the card id in the variables rather than bound at
 * hook time, for callers whose target can change while a write is queued — the
 * card panel debounces its writes, so the id has to travel with the patch.
 */
export function useSaveCard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: CardPatch }) =>
      api.updateCard(id, patch),
    onSettled: (_data, _err, { id }) => {
      qc.invalidateQueries({ queryKey: keys.card(id) })
      qc.invalidateQueries({ queryKey: keys.digest })
    },
  })
}

/**
 * Persists a reordered board (computed by the drag handler). Unlike the other
 * mutations, this *does* update the cache up front — not for latency (the write
 * is instant) but for timing: @hello-pangea/dnd needs the new order committed
 * within the drop event, which `flushSyncUpdate` forces.
 */
export function useMoveCard(deckId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (changed: Card[]) => api.moveCard(deckId, changed),
    // Synchronous on purpose (no awaited `cancelQueries`) and flushed eagerly, so
    // the reorder is committed inside the drop event — see `flushSyncUpdate`.
    onMutate: (changed) => {
      const previous = qc.getQueryData<Board>(keys.board(deckId))
      if (previous) {
        const updates = new Map(changed.map((c) => [c.id, c]))
        const next: Board = {
          ...previous,
          cards: previous.cards.map((c) => updates.get(c.id) ?? c),
        }
        flushSyncUpdate(() => qc.setQueryData(keys.board(deckId), next))
      }
      return { previous }
    },
    onError: (_err, _changed, ctx) => {
      if (ctx?.previous) qc.setQueryData(keys.board(deckId), ctx.previous)
    },
    // A move can land the card in another column, changing its digest tag.
    onSettled: () => {
      qc.invalidateQueries({ queryKey: keys.board(deckId) })
      qc.invalidateQueries({ queryKey: keys.digest })
    },
  })
}
