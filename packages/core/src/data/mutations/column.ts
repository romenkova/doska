import { useMutation, useQueryClient } from "@tanstack/react-query"
import * as api from "../../api/operations"
import type { Board, Column } from "../../types"
import { pushUndo } from "../../undo"
import { keys } from "../keys"
import { replaceById, useBoardPatch } from "./board-patch"

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

const patchColumn = (
  board: Board,
  id: string,
  patch: Partial<Column>
): Board => ({
  ...board,
  columns: board.columns.map((c) => (c.id === id ? { ...c, ...patch } : c)),
})

/** Toggles a column's collapse state (card bodies hidden down to titles). */
export function useSetColumnCollapsed(deckId: string) {
  return useBoardPatch(
    deckId,
    ({ id, collapsed }: { id: string; collapsed: boolean }) =>
      api.setColumnCollapsed(id, collapsed),
    {
      apply: (board, { id, collapsed }) =>
        patchColumn(board, id, { collapsed }),
    }
  )
}

/** Sets a column's color; the swatch and every pill re-tint immediately. */
export function useSetColumnColor(deckId: string) {
  return useBoardPatch(
    deckId,
    ({ id, color }: { id: string; color: string }) =>
      api.setColumnColor(id, color),
    { apply: (board, { id, color }) => patchColumn(board, id, { color }) }
  )
}

/** Marks the board's done column. */
export function useSetColumnDone(deckId: string) {
  return useBoardPatch(
    deckId,
    ({ id, done }: { id: string; done: boolean }) =>
      api.setColumnDone(id, done),
    {
      apply: (board, { id, done }) => patchColumn(board, id, { done }),
      also: () => [keys.digest],
    }
  )
}

export function useDeleteColumn(deckId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteColumn(deckId, id),
    onSuccess: (_data, id) => pushUndo("columns", id),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: keys.board(deckId) })
      qc.invalidateQueries({ queryKey: keys.digest })
      qc.invalidateQueries({ queryKey: keys.trash })
    },
  })
}

/**
 * Persists a reordered column (computed by the reorder modal). Flushed for the
 * same reason as {@link useMoveCard}: the modal renders its blocks straight from
 * `keys.board`, sorted by position, so the new order has to be committed inside
 * the drop event.
 */
export function useMoveColumn(deckId: string) {
  return useBoardPatch(deckId, (changed: Column[]) => api.moveColumn(changed), {
    apply: (board, changed) => ({
      ...board,
      columns: replaceById(board.columns, changed),
    }),
    flush: true,
  })
}
