import { cn } from "@doska/ui-kit"
import { Calendar } from "lucide-react"
import { deadlineStatus, formatDeadline } from "@/lib/utils"
import type { DeadlineStatus } from "@/lib/utils"

const CHIP_BY_STATUS: Record<DeadlineStatus, string> = {
  overdue: "bg-destructive/10 text-destructive",
  soon: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  upcoming: "bg-muted text-foreground/80",
}

/** The deadline badge: a rounded chip, shaded by how close the deadline is. */
export function DeadlineChip({
  value,
  className,
}: {
  value: string
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5",
        "text-xs font-semibold tabular-nums",
        CHIP_BY_STATUS[deadlineStatus(value)],
        className
      )}
    >
      <Calendar className="size-3.5" />
      {formatDeadline(value)}
    </span>
  )
}
