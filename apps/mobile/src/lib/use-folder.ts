import { type SidebarFolderNode, useSidebarTree } from "@doska/core"

export function useFolder(id: string | undefined): SidebarFolderNode | null {
  const { data: nodes = [] } = useSidebarTree()
  const folder = nodes.find((node) => node.type === "folder" && node.id === id)
  return folder?.type === "folder" ? folder : null
}
