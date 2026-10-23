import { FolderPlus } from "lucide-react"
import { useState } from "react"
import { DraggableFolders, useFolderTree } from "../src"
import { folder, INITIAL } from "./data"
import { type Depth, LIMITS } from "./depth"
import { DepthPicker } from "./depth-picker"
import { FolderRow } from "./folder-row"
import { ItemRow } from "./item-row"
import { TreeOutline } from "./tree-outline"

export function App() {
  const tree = useFolderTree({ nodes: INITIAL })
  const [depth, setDepth] = useState<Depth>("∞")
  const [renamingId, setRenamingId] = useState<string | null>(null)

  const addFolder = (parentId?: string) => {
    const created = folder("New folder")
    tree.addFolder(created, parentId)
    setRenamingId(created.id)
  }

  return (
    <div className="min-h-dvh bg-zinc-50 px-4 py-16 text-sm text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-100">
      <main className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-semibold tracking-tight">
          react-draggable-folders
        </h1>
        <p className="mt-2 max-w-prose text-zinc-500">
          A folder tree you drag.
          <br />
          Pull right while dragging to nest, left to step out. <br />
          Click a folder to collapse it.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-[320px_1fr]">
          <section className="rounded-2xl bg-white p-2 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
            <div className="flex items-center justify-between px-2 pt-1 pb-2">
              <span className="text-xs font-medium tracking-wide text-zinc-400 uppercase">
                Folders
              </span>
              <button
                type="button"
                onClick={() => addFolder()}
                aria-label="New folder"
                title="New folder"
                className="grid size-7 place-items-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                <FolderPlus className="size-4" />
              </button>
            </div>
            <DraggableFolders
              tree={tree}
              limits={LIMITS[depth]}
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
                <div className="flex h-8 items-center px-2 pl-8 text-xs text-zinc-400">
                  Empty
                </div>
              )}
            />
          </section>

          <section className="space-y-4">
            <DepthPicker value={depth} onChange={setDepth} />
            <div className="rounded-2xl p-4 ring-1 ring-zinc-200 dark:ring-zinc-800">
              <div className="mb-2 text-xs font-medium tracking-wide text-zinc-400 uppercase">
                Tree
              </div>
              <TreeOutline nodes={tree.nodes} />
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
