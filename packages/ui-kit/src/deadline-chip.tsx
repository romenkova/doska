import { Calendar } from "lucide-react"
import { cn } from "./lib/cn"
import {
  deadlineRelative,
  deadlineStatus,
  formatDeadline,
  type DeadlineStatus,
} from "./lib/deadline"

const CHIP_BY_STATUS: Record<DeadlineStatus, string> = {
  overdue: "bg-destructive/10 text-destructive/80",
  soon: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  upcoming: "text-muted-foreground hover:text-foreground",
}

interface IProps {
  value: string | null
  className?: string
  done: boolean
}

/**
 * The deadline badge: a rounded chip, shaded by how close the deadline is.
 * Soon reads as relative time ("in 3 days"); anything further out shows the date.
 */
export function DeadlineChip({ value, className, done }: IProps) {
  // A done card is neutral whatever its deadline: no red, plain date.
  const status = done || !value ? "upcoming" : deadlineStatus(value)
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
