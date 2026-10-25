import { useMutation, useQueryClient } from "@tanstack/react-query"
import * as api from "../../api/operations"
import type { Dashboard } from "../../types"
import { pushUndo } from "../../undo"
import { keys } from "../keys"

export function useCreateDashboard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => api.createDashboard(name),
    onSettled: () => qc.invalidateQueries({ queryKey: keys.dashboards }),
  })
}

export function useDuplicateDashboard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (board: Dashboard) =>
      api.createDashboard(board.title, board.id),
    onSettled: () => qc.invalidateQueries({ queryKey: keys.dashboards }),
  })
}

export function useSetDashboardTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, template }: { id: string; template: boolean }) =>
      api.setDashboardTemplate(id, template),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: keys.dashboards })
      qc.invalidateQueries({ queryKey: keys.digest })
    },
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

export function useSetDashboardSort() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, sort }: { id: string; sort: string[] }) =>
      api.setDashboardSort(id, sort),
    onSettled: () => qc.invalidateQueries({ queryKey: keys.dashboards }),
  })
}

export function useDeleteDashboard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteDashboard(id),
    onSuccess: (_data, id) => pushUndo("dashboards", id),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: keys.dashboards })
      qc.invalidateQueries({ queryKey: keys.digest })
      qc.invalidateQueries({ queryKey: keys.trash })
    },
  })
}
