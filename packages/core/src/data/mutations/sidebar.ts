import { useMutation, useQueryClient } from "@tanstack/react-query"
import * as api from "../../api/operations"
import type { SidebarNode } from "../../api/operations"
import { keys } from "../keys"

export function useSaveSidebarTree() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (nodes: SidebarNode[]) =>
      api.saveSidebarItems(api.treeItems(nodes)),
    onSettled: () => qc.invalidateQueries({ queryKey: keys.sidebar }),
  })
}
