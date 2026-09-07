import { ChevronRight } from "lucide-react"
import { getBoard } from "@doska/core/operations"
import { CardPane } from "@/components/card-panel/card-pane"
import { DeckProvider } from "@/providers/deck/deck-context"
import { BoardPicker } from "./board-picker"
import { ColumnPicker } from "./column-picker"
import { ShortcutHint } from "./shortcut-hint"
import { useQuickNoteCard } from "./use-quick-note-card"
import {
  announceChange,
  hideWindow,
  useQuickNoteWindow,
} from "./use-quick-note-window"
import { useTargetBoard } from "./use-target-board"

/**
 * The desktop quick-note popup
 */
export function QuickNotePage() {
  const target = useTargetBoard()
  const note = useQuickNoteCard(target)

  const boardId = note.column?.dashboardId ?? target.boardId
  const board = target.dashboards.find((d) => d.id === boardId)
  const column = note.column ?? target.column

  useQuickNoteWindow({
    onShow: note.refresh,
    onClose: () => void close(),
    onNew: () => void startNew(),
  })

  async function close() {
    if (!note.cardId) {
      await hideWindow()
      return
    }
    const empty = note.isEmpty()
    if (empty) await note.discard()
    else note.flush()
    await announceChange()
    await hideWindow()
    if (empty) note.forget()
  }

  /** Files the current card and starts a blank one; a blank one is kept as is. */
  async function startNew() {
    if (!note.cardId || note.isEmpty()) return
    note.flush()
    await announceChange()
    note.forget()
  }

  /** The next new card goes there; the current one moves there now. */
  async function pickBoard(id: string) {
    target.pick(id)
    const first = (await getBoard(id)).columns[0]
    if (first) void note.moveTo(first.id)
  }

  function pickColumn(id: string) {
    target.pickColumn(id)
    void note.moveTo(id)
  }

  return (
    <div className="flex h-svh">
      <div className="flex min-h-0 w-full flex-col overflow-hidden rounded-xl border bg-background">
        <DeckProvider value={{ id: boardId ?? "", sort: [] }}>
          {note.cardId && note.content && (
            <CardPane
              key={`${note.cardId}:${note.shows}`}
              cardId={note.cardId}
              content={note.content}
              onQueue={note.queue}
              bare
              onClose={() => void close()}
            />
          )}
        </DeckProvider>
        <div className="flex items-center justify-between gap-3 border-t bg-muted/30 px-2 py-1.5 text-xs text-muted-foreground">
          <div className="flex min-w-0 items-center gap-0.5">
            <BoardPicker
              dashboards={target.dashboards}
              board={board}
              onPick={(id) => void pickBoard(id)}
            />
            {column && (
              <>
                <ChevronRight className="size-3 shrink-0 text-muted-foreground/50" />
                <ColumnPicker
                  columns={target.columns}
                  column={column}
                  onPick={pickColumn}
                />
              </>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            <ShortcutHint
              keys="⌘N"
              label="New"
              onClick={() => void startNew()}
            />
            <ShortcutHint
              keys="esc"
              label="Close"
              onClick={() => void close()}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
