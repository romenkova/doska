import { Button, SidebarTrigger, cn } from "@doska/ui-kit"
import { Check } from "lucide-react"
import type { DigestFilter } from "@/lib/api/operations"

const FILTERS: { id: DigestFilter; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "Upcoming" },
]

interface IProps {
  filter: DigestFilter
  onChangeFilter: (filter: DigestFilter) => void
  hideDone: boolean
  onToggleHideDone: () => void
}

export function DigestHeader({
  filter,
  onChangeFilter,
  hideDone,
  onToggleHideDone,
}: IProps) {
  return (
    <header className="flex h-11.5 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger />
      <h1 className="text-base font-semibold">Upcoming</h1>
      <div className="ml-auto flex items-center gap-1">
        <Button
          size="sm"
          variant={hideDone ? "secondary" : "ghost"}
          aria-pressed={hideDone}
          className={cn(!hideDone && "text-muted-foreground")}
          onClick={onToggleHideDone}
        >
          <Check />
          Hide done
        </Button>
        {FILTERS.map(({ id, label }) => (
          <Button
            key={id}
            size="sm"
            variant={id === filter ? "secondary" : "ghost"}
            aria-pressed={id === filter}
            className={cn(id !== filter && "text-muted-foreground")}
            onClick={() => onChangeFilter(id)}
          >
            {label}
          </Button>
        ))}
      </div>
    </header>
  )
}
