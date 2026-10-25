import { Button, Card as CardBase } from "@doska/ui-kit"
import { LayoutDashboard, X } from "lucide-react"
import {
  useDuplicateDashboard,
  useSetDashboardTemplate,
  type Dashboard,
} from "@doska/core"
import { useDashboardNav } from "@/lib/hooks/use-dashboard-nav"

export function BoardTemplateRow({ board }: { board: Dashboard }) {
  const { mutate: duplicate, isPending } =
    useDuplicateDashboard()
  const { mutate: setTemplate } = useSetDashboardTemplate()
  const { selectDashboard } = useDashboardNav()

  return (
    <li>
      <CardBase className="flex-row items-center gap-3 rounded-xl px-3">
        <LayoutDashboard className="size-4 shrink-0 text-muted-foreground" />
        <button
          type="button"
          onClick={() => selectDashboard(board.id)}
          className="min-w-0 flex-1 truncate text-left text-base font-medium hover:underline"
        >
          {board.title || "Untitled board"}
        </button>
        <Button
          size="sm"
          variant="secondary"
          disabled={isPending}
          onClick={() =>
            duplicate(board, {
              onSuccess: (created) => selectDashboard(created.id),
            })
          }
        >
          New board
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Remove from templates"
          className="text-muted-foreground"
          onClick={() => setTemplate({ id: board.id, template: false })}
        >
          <X />
        </Button>
      </CardBase>
    </li>
  )
}
