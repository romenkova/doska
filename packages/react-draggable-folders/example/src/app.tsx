import { FolderPlus } from "lucide-react"
import { useState } from "react"
import { DraggableFolders, useFolderTree } from "../../src"
import { Badge } from "./components/badge"
import { Docs } from "./components/docs"
import { FolderRow } from "./components/folder-row"
import { IconButton } from "./components/icon-button"
import { InstallCommand } from "./components/install-command"
import { ItemRow } from "./components/item-row"
import { TreeData } from "./components/tree-data"
import { folder, INITIAL } from "./lib/data"

export function App() {
  const tree = useFolderTree({ nodes: INITIAL })
  const [renamingId, setRenamingId] = useState<string | null>(null)

  const addFolder = (parentId?: string) => {
    const created = folder("New folder")
    tree.addFolder(created, parentId)
    setRenamingId(created.id)
  }

  return (
    <div className="min-h-dvh bg-white px-4 py-16 text-sm text-zinc-950 antialiased dark:bg-zinc-950 dark:text-zinc-50">
      <main className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-semibold tracking-tight">
          react-draggable-folders
        </h1>
        <p className="mt-2 max-w-prose text-zinc-600 dark:text-zinc-400">
          A drag-and-drop folder tree for React.
          <br />
          Drag rows to reorder them. While dragging, move the pointer right to
          put a row into a folder, left to take it out. Click a folder to
          collapse it.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge>{__PACKAGE_KB__} KB gzipped</Badge>
          <Badge>React 19</Badge>
          <Badge href="https://github.com/hello-pangea/dnd">
            built on @hello-pangea/dnd
          </Badge>
        </div>
        <div className="mt-6">
          <InstallCommand />
        </div>

        <div className="mt-10 grid overflow-hidden rounded-2xl bg-zinc-50 ring-1 ring-zinc-200 md:grid-cols-[320px_1fr] dark:bg-zinc-900 dark:ring-zinc-800">
          <section className="bg-white p-2 dark:bg-zinc-950">
            <div className="flex items-center justify-between px-2 pt-1 pb-2">
              <span className="font-medium">Folders</span>
              <IconButton label="New folder" onClick={() => addFolder()}>
                <FolderPlus className="size-4" />
              </IconButton>
            </div>
            <DraggableFolders
              tree={tree}
              isDragDisabled={(id) => id === renamingId}
              className="m-0 list-none space-y-0.5 p-0"
              renderItem={(item, { dragging }) => (
                <ItemRow item={item} dragging={dragging} />
              )}
              renderFolder={(node, { dragging, collapsed, isDropTarget }) => (
                <FolderRow
                  folder={node}
                  dragging={dragging}
                  collapsed={collapsed}
                  isDropTarget={isDropTarget}
                  renaming={node.id === renamingId}
                  onToggle={() => tree.toggle(node.id)}
                  onRenameStart={() => setRenamingId(node.id)}
                  onRename={(title) => {
                    tree.updateFolder(node.id, { title })
                    setRenamingId(null)
                  }}
                  onNewSubfolder={() => addFolder(node.id)}
                  onDelete={() => tree.removeFolder(node.id)}
                />
              )}
              renderEmpty={() => (
                <div className="flex h-8 items-center px-2 pl-8 text-xs text-zinc-500">
                  Empty
                </div>
              )}
            />
          </section>

          <section className="h-96 border-t border-zinc-200 md:relative md:h-auto md:border-t-0 md:border-l dark:border-zinc-800">
            <div className="h-full md:absolute md:inset-0">
              <TreeData nodes={tree.nodes} />
            </div>
          </section>
        </div>

        <Docs />
      </main>
    </div>
  )
}
