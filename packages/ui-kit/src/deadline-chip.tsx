import { Calendar } from "lucide-react"
import { cn } from "./lib/cn"
import {
  deadlineRelative,
  deadlineStatus,
  type DeadlineStatus,
} from "@doska/utils/dates"

const CHIP_BY_STATUS: Record<DeadlineStatus, string> = {
  overdue: "text-destructive/80",
  soon: "text-amber-600/80 dark:text-amber-400/80",
  upcoming: "text-muted-foreground hover:text-foreground",
}

/** Same as `formatDeadline`, but drops the year when it's the current one. */
function formatDeadlineNoYearIfCurrent(iso: string): string {
  const [year, month, day] = iso.split("-")
  const sameYear = Number(year) === new Date().getFullYear()
  return sameYear ? `${day}.${month}` : `${day}.${month}.${year}`
}

interface IProps {
  value: string | null
  className?: string
  done: boolean
}

/**
 * The deadline badge: a calendar icon and a date, colored by how close it is.
 * Soon reads as relative time ("in 3 days"); anything further out shows the date.
 */
export function DeadlineChip({ value, className, done }: IProps) {
  const status = done || !value ? "upcoming" : deadlineStatus(value)
  const label = value
    ? status === "soon" || status === "overdue"
      ? deadlineRelative(value)
      : formatDeadlineNoYearIfCurrent(value)
    : null

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1",
        "text-sm font-semibold tabular-nums md:text-xs",
        CHIP_BY_STATUS[status],
        className
      )}
    >
      <Calendar className="size-4 md:size-3.5 shrink-0" />
      <span className="whitespace-nowrap">{label}</span>
    </span>
  )
}
