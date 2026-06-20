import { Anchor, Plus } from "lucide-react"
import { Button, SidebarTrigger } from "@deck/ui-kit"

interface IProps {
  hasBoards: boolean
  onCreateDashboard: () => void
}

export function Home({ hasBoards, onCreateDashboard }: IProps) {
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
        <Button onClick={onCreateDashboard}>
          <Plus className="size-4" />
          Create a board
        </Button>
      </div>
    </div>
  )
}
