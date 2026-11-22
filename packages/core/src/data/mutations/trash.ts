import { useMutation, useQueryClient } from "@tanstack/react-query"
import * as api from "../../api/operations"
import type { TrashKind } from "../../api/operations"
import { keys } from "../keys"

/**
 * Brings a deletion back, cascade and all. A restore can revive a board, a
 * column and any number of cards at once, so every list is refreshed rather
 * than picked at.
 */
export function useRestore() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ kind, id }: { kind: TrashKind; id: string }) =>
      api.restore(kind, id),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: keys.dashboards })
      qc.invalidateQueries({ queryKey: keys.boards })
      qc.invalidateQueries({ queryKey: keys.cards })
      qc.invalidateQueries({ queryKey: keys.digest })
      qc.invalidateQueries({ queryKey: keys.trash })
    },
  })
}

export function useDeleteForever() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ kind, id }: { kind: TrashKind; id: string }) =>
      api.deleteForever(kind, id),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: keys.trash })
      void qc.invalidateQueries({ queryKey: keys.boards })
    },
  })
}
