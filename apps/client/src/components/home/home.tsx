import { Anchor, ArrowRight, Plus } from "lucide-react"
import { Button, SidebarTrigger } from "@doska/ui-kit"
import type { Dashboard } from "@/lib/types"

interface IProps {
  hasBoards: boolean
  /** The board open most recently, offered as a "continue editing" shortcut. */
  lastBoard: Dashboard | null
  onContinue: () => void
  onCreateDashboard: () => void
}

export function Home({
  hasBoards,
  lastBoard,
  onContinue,
  onCreateDashboard,
}: IProps) {
  return (
    <div className="flex h-full flex-1 flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger />
      </header>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <Anchor className="size-8" />
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">
            {hasBoards ? "Pick a board to get started" : "No boards yet"}
          </h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            {hasBoards
              ? "Choose a board from the sidebar, or create a new one."
              : "Create a board to start organizing your work into columns and cards."}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {lastBoard && (
            <Button variant="secondary" onClick={onContinue}>
              Continue editing {lastBoard.title || "Untitled board"}
              <ArrowRight className="size-4" />
            </Button>
          )}
          <Button onClick={onCreateDashboard}>
            <Plus className="size-4" />
            Create a board
          </Button>
        </div>
      </div>
    </div>
  )
}
