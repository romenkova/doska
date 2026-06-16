import { Anchor, Plus } from "lucide-react"
import { Button } from "@/components/ui"

interface IProps {
  /** Whether any boards exist — lets the page greet vs. onboard. */
  hasBoards: boolean
  onCreateDashboard: () => void
}

/**
 * The root URL's page. Rendered whenever no board is selected — on first visit,
 * after deleting the last board, or any time the user navigates back to `/`.
 * This is the place to grow a real landing/overview; for now it welcomes and
 * points the way to a board.
 */
export function Home({ hasBoards, onCreateDashboard }: IProps) {
  return (
    <div className="flex h-full flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
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
  )
}
