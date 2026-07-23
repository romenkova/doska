import { useMutation, useQueryClient } from "@tanstack/react-query"
import * as api from "@/lib/api/operations"
import type { Board, Column } from "@/lib/types"
import { keys } from "../keys"
import { flushSyncUpdate } from "./flush-sync"

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
 * Optimistic single-column patch: writes `patch` into the board cache up front
 * so the change is instant, rolls back on error, then reconciles on settle.
 * `alsoInvalidate` refreshes dependent queries (e.g. the digest).
 */
function useColumnPatch<V extends { id: string }>(
  deckId: string,
  mutationFn: (vars: V) => Promise<unknown>,
  toPatch: (vars: V) => Partial<Column>,
  alsoInvalidate: readonly (readonly unknown[])[] = []
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn,
    onMutate: (vars: V) => {
      const previous = qc.getQueryData<Board>(keys.board(deckId))
      if (previous) {
        const patch = toPatch(vars)
        qc.setQueryData<Board>(keys.board(deckId), {
          ...previous,
          columns: previous.columns.map((c) =>
            c.id === vars.id ? { ...c, ...patch } : c
          ),
        })
      }
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(keys.board(deckId), ctx.previous)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: keys.board(deckId) })
      for (const queryKey of alsoInvalidate) qc.invalidateQueries({ queryKey })
    },
  })
}

/** Toggles a column's collapse state (card bodies hidden down to titles). */
export function useSetColumnCollapsed(deckId: string) {
  return useColumnPatch(
    deckId,
    ({ id, collapsed }: { id: string; collapsed: boolean }) =>
      api.setColumnCollapsed(id, collapsed),
    ({ collapsed }) => ({ collapsed })
  )
}

/** Sets a column's color; the swatch and every pill re-tint immediately. */
export function useSetColumnColor(deckId: string) {
  return useColumnPatch(
    deckId,
    ({ id, color }: { id: string; color: string }) =>
      api.setColumnColor(id, color),
    ({ color }) => ({ color })
  )
}

/** Marks a done column. Any number of columns on a board can hold the flag. */
export function useSetColumnDone(deckId: string) {
  return useColumnPatch(
    deckId,
    ({ id, done }: { id: string; done: boolean }) =>
      api.setColumnDone(id, done),
    ({ done }) => ({ done }),
    [keys.digest]
  )
}

export function useDeleteColumn(deckId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteColumn(deckId, id),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: keys.board(deckId) })
      qc.invalidateQueries({ queryKey: keys.digest })
    },
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
