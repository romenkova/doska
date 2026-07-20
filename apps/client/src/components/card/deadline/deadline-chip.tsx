import { cn } from "@doska/ui-kit"
import { Calendar } from "lucide-react"
import { deadlineRelative, deadlineStatus, formatDeadline } from "@/lib/utils"
import type { DeadlineStatus } from "@/lib/utils"

const CHIP_BY_STATUS: Record<DeadlineStatus, string> = {
  overdue: "bg-destructive/10 text-destructive/80",
  soon: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  upcoming: "text-muted-foreground hover:text-foreground",
}

/**
 * The deadline badge: a rounded chip, shaded by how close the deadline is.
 * Soon reads as relative time ("in 3 days"); anything further out shows the date.
 */
export function DeadlineChip({
  value,
  className,
}: {
  value: string | null
  className?: string
}) {
  const status = value ? deadlineStatus(value) : "upcoming"
  const label = value
    ? status === "soon" || status === "overdue"
      ? deadlineRelative(value)
      : formatDeadline(value)
    : null
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5",
        "text-xs font-semibold tabular-nums",
        CHIP_BY_STATUS[status],
        className
      )}
    >
      <Calendar className="size-3.5" />
      {label}
    </span>
  )
}
