import { Button } from "@doska/ui-kit"
import { Columns3, Rows3 } from "lucide-react"
import type { DashboardView } from "@doska/core"

interface IProps {
  view: DashboardView
  onChangeView: (view: DashboardView) => void
}

/** Swaps the board between its columns and the date-grouped row list. */
export function RowViewButton({ view, onChangeView }: IProps) {
  const isRows = view === "rows"
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={isRows ? "Show columns" : "Show rows"}
      aria-pressed={isRows}
      className="text-muted-foreground"
      onClick={() => onChangeView(isRows ? "board" : "rows")}
    >
      {isRows ? <Columns3 /> : <Rows3 />}
    </Button>
  )
}
