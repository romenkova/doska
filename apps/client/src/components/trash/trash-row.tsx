import { Button, Card as CardBase } from "@doska/ui-kit"
import { Columns3, LayoutDashboard, StickyNote } from "lucide-react"
import { expiryLabel, type TrashEntry, type TrashKind } from "@doska/core"

const ICONS: Record<TrashKind, typeof StickyNote> = {
  cards: StickyNote,
  columns: Columns3,
  dashboards: LayoutDashboard,
}

interface IProps {
  entry: TrashEntry
  isRestoring: boolean
  onRestore: () => void
}

export function TrashRow({ entry, isRestoring, onRestore }: IProps) {
  const Icon = ICONS[entry.kind]

  return (
    <li>
      <CardBase className="flex-row items-center gap-3 rounded-xl px-3">
        <Icon className="size-4 shrink-0 text-muted-foreground" />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-base font-medium">{entry.title}</span>
          <span className="truncate text-sm text-muted-foreground">
            {entry.context}
            {entry.cardCount > 0 &&
              ` · ${entry.cardCount} ${entry.cardCount === 1 ? "card" : "cards"}`}
          </span>
        </span>
        <span className="shrink-0 text-sm text-muted-foreground max-sm:hidden">
          {expiryLabel(entry.expiresAt)}
        </span>
        <Button
          size="sm"
          variant="secondary"
          disabled={isRestoring}
          onClick={onRestore}
        >
          Restore
        </Button>
      </CardBase>
    </li>
  )
}
