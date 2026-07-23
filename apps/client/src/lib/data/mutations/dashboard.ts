import { useMutation, useQueryClient } from "@tanstack/react-query"
import * as api from "@/lib/api/operations"
import { keys } from "../keys"

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
    onSettled: () => {
      qc.invalidateQueries({ queryKey: keys.dashboards })
      qc.invalidateQueries({ queryKey: keys.digest })
    },
  })
}
