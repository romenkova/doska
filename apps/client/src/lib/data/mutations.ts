import { flushSync } from "react-dom"
import {
  notifyManager,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"
import * as authApi from "@/lib/api/auth"
import * as api from "@/lib/api/operations"
import { sync } from "@/lib/api/sync"
import type { Board, Card, Column } from "@/lib/types"
import { keys } from "./keys"

export function useLogin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ login, password }: { login: string; password: string }) =>
      authApi.login(login, password),
    onSuccess: (_data, { login }) => {
      qc.setQueryData(keys.session, { authed: true, login })
      // Now authorized — flush whatever queued up while signed out.
      void sync.reconcile()
    },
  })
}

export function useLogout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () =>
      qc.setQueryData(keys.session, { authed: false, login: null }),
  })
}

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

export function useUpdateDashboardPrefix() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, prefix }: { id: string; prefix: string }) =>
      api.setDashboardPrefix(id, prefix),
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
    mutationFn: (columnId: string) => api.createCard(columnId),
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

export function useCreateColumn(deckId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (title: string) => api.createColumn(deckId, title),
    onSettled: () => qc.invalidateQueries({ queryKey: keys.board(deckId) }),
  })
}

export function useRenameColumn(deckId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      api.renameColumn(id, title),
    onSettled: () => qc.invalidateQueries({ queryKey: keys.board(deckId) }),
  })
}

/**
 * Toggles a column's collapse state (card bodies hidden down to titles). The
 * board cache is patched up front so the toggle is instant, then synced.
 */
export function useSetColumnCollapsed(deckId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, collapsed }: { id: string; collapsed: boolean }) =>
      api.setColumnCollapsed(id, collapsed),
    onMutate: ({ id, collapsed }) => {
      const previous = qc.getQueryData<Board>(keys.board(deckId))
      if (previous) {
        const next: Board = {
          ...previous,
          columns: previous.columns.map((c) =>
            c.id === id ? { ...c, collapsed } : c
          ),
        }
        qc.setQueryData(keys.board(deckId), next)
      }
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(keys.board(deckId), ctx.previous)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: keys.board(deckId) }),
  })
}

export function useDeleteColumn(deckId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteColumn(deckId, id),
    onSettled: () => qc.invalidateQueries({ queryKey: keys.board(deckId) }),
  })
}

/**
 * Persists a reordered column (computed by the reorder modal). Like
 * {@link useMoveCard}, the board cache is updated up front and flushed eagerly
 * so the new order is committed inside the drop event — the modal renders its
 * blocks straight from `keys.board`, sorted by position.
 */
export function useMoveColumn(deckId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (changed: Column[]) => api.moveColumn(changed),
    onMutate: (changed) => {
      const previous = qc.getQueryData<Board>(keys.board(deckId))
      if (previous) {
        const updates = new Map(changed.map((c) => [c.id, c]))
        const next: Board = {
          ...previous,
          columns: previous.columns.map((c) => updates.get(c.id) ?? c),
        }
        flushSyncUpdate(() => qc.setQueryData(keys.board(deckId), next))
      }
      return { previous }
    },
    onError: (_err, _changed, ctx) => {
      if (ctx?.previous) qc.setQueryData(keys.board(deckId), ctx.previous)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: keys.board(deckId) }),
  })
}

export type CardPatch = Partial<
  Pick<Card, "title" | "body" | "deadline" | "attachments">
>

export function useUpdateCard(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (patch: CardPatch) => api.updateCard(id, patch),
    onSettled: () => qc.invalidateQueries({ queryKey: keys.card(id) }),
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
    onSettled: (_data, _err, { id }) =>
      qc.invalidateQueries({ queryKey: keys.card(id) }),
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
    onSettled: () => qc.invalidateQueries({ queryKey: keys.board(deckId) }),
  })
}
