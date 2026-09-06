import { CardPane } from "@/components/card-panel/card-pane"
import { DeckProvider } from "@/providers/deck/deck-context"
import { BoardPicker } from "./board-picker"
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
  function pickBoard(id: string) {
    target.pick(id)
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
        <div className="flex items-center justify-between gap-3 border-t px-3 py-2 text-xs text-muted-foreground">
          <BoardPicker
            dashboards={target.dashboards}
            board={board}
            column={column}
            onPick={pickBoard}
          />
          <span className="shrink-0">⌘N new · esc close</span>
        </div>
      </div>
    </div>
  )
}
