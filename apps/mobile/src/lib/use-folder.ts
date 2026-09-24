import type { SidebarFolderNode } from "@doska/core/operations"
import { useSidebarTree } from "@doska/core/queries"

export function useFolder(id: string | undefined): SidebarFolderNode | null {
  const { data: nodes = [] } = useSidebarTree()
  const folder = nodes.find((node) => node.type === "folder" && node.id === id)
  return folder?.type === "folder" ? folder : null
}
