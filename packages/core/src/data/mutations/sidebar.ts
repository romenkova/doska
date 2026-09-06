import { useMutation, useQueryClient } from "@tanstack/react-query"
import * as api from "../../api/operations"
import type { SidebarNode } from "../../api/operations"
import { keys } from "../keys"
import { flushSyncUpdate } from "./flush-sync"

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

export function useRenameFolder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      api.renameFolder(id, title),
    onSettled: () => qc.invalidateQueries({ queryKey: keys.sidebar }),
  })
}

export function useDeleteFolder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteFolder(id),
    onSettled: () => qc.invalidateQueries({ queryKey: keys.sidebar }),
  })
}

// Synchronous, or dnd paints the old order for a frame before the refetch.
export function useMoveSidebarItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, target }: { id: string; target: api.SidebarTarget }) =>
      api.moveSidebarItem(id, target),
    onMutate: ({ id, target }) => {
      const previous = qc.getQueryData<SidebarNode[]>(keys.sidebar)
      if (previous) {
        const moved = api.buildTree(
          api.moveItem(api.treeItems(previous), id, target),
          api.treeDashboards(previous)
        )
        flushSyncUpdate(() => qc.setQueryData(keys.sidebar, moved))
      }
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(keys.sidebar, ctx.previous)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: keys.sidebar }),
  })
}
