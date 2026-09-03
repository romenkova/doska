import { useMutation, useQueryClient } from "@tanstack/react-query"
import * as api from "../../api/operations"
import { keys } from "../keys"

export function useCreateFolder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (title: string) => api.createFolder(title),
    onSettled: () => qc.invalidateQueries({ queryKey: keys.sidebar }),
  })
}

export function useSetFolderCollapsed() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, collapsed }: { id: string; collapsed: boolean }) =>
      api.setFolderCollapsed(id, collapsed),
    onSettled: () => qc.invalidateQueries({ queryKey: keys.sidebar }),
  })
}
