import { flushSync } from "react-dom"
import {
  notifyManager,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"
import * as api from "@/lib/api"
import type { Card } from "@/lib/card-data"
import type { BoardItems } from "@/lib/dashboards"
import { keys } from "./keys"

export function useCreateDashboard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => api.createDashboard(name),
    onSettled: () => qc.invalidateQueries({ queryKey: keys.dashboards }),
  })
}

export function useRenameDashboard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      api.renameDashboard(id, name),
    onSettled: () => qc.invalidateQueries({ queryKey: keys.dashboards }),
  })
}

export function useDeleteDashboard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteDashboard(id),
    onSettled: () => qc.invalidateQueries({ queryKey: keys.dashboards }),
  })
}


export function useCreateCard(deckId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (columnId: string) => api.createCard(deckId, columnId),
    onSettled: () => qc.invalidateQueries({ queryKey: keys.board(deckId) }),
  })
}

export function useDeleteCard(deckId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteCard(deckId, id),
    onSettled: () => qc.invalidateQueries({ queryKey: keys.board(deckId) }),
  })
}

export function useUpdateCard(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (card: Card) => api.updateCard(id, card),
    onSettled: () => qc.invalidateQueries({ queryKey: keys.card(id) }),
  })
}

/**
 * Runs a cache update with React Query's re-render notification flushed
 * synchronously, then restores the default (deferred, macrotask) scheduler.
 *
 * RQ normally defers notifications to a `setTimeout(0)`, which lands an optimistic
 * update a frame late — @hello-pangea/dnd needs the reordered board committed
 * before the drop event returns, or the card snaps back to its old column for a
 * frame. Rather than make every query in the app notify synchronously, we opt in
 * only for this one update.
 */
function flushSyncUpdate(update: () => void) {
  notifyManager.setScheduler((cb) => flushSync(cb))
  try {
    update()
  } finally {
    notifyManager.setScheduler((cb) => setTimeout(cb, 0))
  }
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
    mutationFn: (next: BoardItems) => api.moveCard(deckId, next),
    // Synchronous on purpose (no awaited `cancelQueries`) and flushed eagerly, so
    // the reorder is committed inside the drop event — see `flushSyncUpdate`.
    onMutate: (next) => {
      const previous = qc.getQueryData<BoardItems>(keys.board(deckId))
      flushSyncUpdate(() => qc.setQueryData(keys.board(deckId), next))
      return { previous }
    },
    onError: (_err, _next, ctx) => {
      if (ctx?.previous) qc.setQueryData(keys.board(deckId), ctx.previous)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: keys.board(deckId) }),
  })
}
