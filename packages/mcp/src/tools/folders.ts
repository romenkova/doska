import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import type { Dashboard, SidebarItem } from "@doska/contract"
import type { Board } from "../board"
import { reply } from "./reply"

type Folder = Extract<SidebarItem, { type: "folder" }>

type BoardNode = { type: "board"; id: string; title: string }

type FolderNode = {
  type: "folder"
  id: string
  title: string
  folders: FolderNode[]
  boards: BoardNode[]
}

export function folderTree(
  items: SidebarItem[],
  dashboards: Dashboard[]
): (BoardNode | FolderNode)[] {
  const byId = new Map(dashboards.map((d) => [d.id, d]))
  const listed = new Set<string>()
  const boards = (ids: string[]): BoardNode[] =>
    ids.flatMap((id) => {
      const dashboard = byId.get(id)
      if (!dashboard) return []
      listed.add(id)
      return [{ type: "board", id, title: dashboard.title }]
    })

  const folders = items.filter((item): item is Folder => item.type === "folder")
  const folderIds = new Set(folders.map((folder) => folder.id))
  const isRoot = (folder: Folder) =>
    !folder.parentId || !folderIds.has(folder.parentId)

  const built = new Set<string>()
  const build = (folder: Folder): FolderNode => {
    built.add(folder.id)
    const subfolders = folders.filter(
      (sub) => sub.parentId === folder.id && !built.has(sub.id)
    )
    return {
      type: "folder",
      id: folder.id,
      title: folder.title,
      folders: subfolders.map(build),
      boards: boards(folder.boardIds),
    }
  }

  const roots = new Map(
    folders.filter(isRoot).map((folder) => [folder.id, build(folder)])
  )
  const tree: (BoardNode | FolderNode)[] = []
  for (const item of items) {
    if (item.type === "board") {
      tree.push(...boards([item.id]))
      continue
    }
    const root = roots.get(item.id)
    if (root) tree.push(root)
    else if (!built.has(item.id)) tree.push(build(item))
  }
  for (const dashboard of dashboards) {
    if (!listed.has(dashboard.id)) {
      tree.push({ type: "board", id: dashboard.id, title: dashboard.title })
    }
  }
  return tree
}

export function registerFolderTools(server: McpServer, board: Board): void {
  server.registerTool(
    "list_folders",
    {
      title: "List folders",
      description:
        "The sidebar as a tree, top to bottom: folders with their " +
        "subfolders and boards, and the boards that sit outside any folder. " +
        "Every board is in it, with its id and title.",
      inputSchema: {},
    },
    async () => {
      const [layout, dashboards] = await Promise.all([
        board.sidebar(),
        board.dashboards(),
      ])
      return reply({ items: folderTree(layout.items, dashboards) })
    }
  )
}
