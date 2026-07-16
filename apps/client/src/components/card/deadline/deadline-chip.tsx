import { cn } from "@doska/ui-kit"
import { Calendar } from "lucide-react"
import { deadlineStatus, formatDeadline } from "@/lib/utils"
import type { DeadlineStatus } from "@/lib/utils"

const CHIP_BY_STATUS: Record<DeadlineStatus, string> = {
  overdue: "bg-destructive/10 text-destructive/70",
  soon: "deadline-chip--soon",
  upcoming: "text-muted-foreground hover:text-foreground",
}

/** The deadline badge: a rounded chip, shaded by how close the deadline is. */
export function DeadlineChip({
  value,
  className,
}: {
  value: string | null
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5",
        "text-xs font-semibold tabular-nums",
        CHIP_BY_STATUS[value ? deadlineStatus(value) : "upcoming"],
        className
      )}
    >
      <Calendar className="size-3.5" />
      {!!value && formatDeadline(value)}
    </span>
  )
}
