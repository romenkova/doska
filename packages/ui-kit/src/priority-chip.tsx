import { Flag } from "lucide-react"
import { PRIORITIES } from "@doska/tokens"
import { cn } from "./lib/cn"

const CHIP_BY_PRIORITY: Record<string, string> = {
  high: "text-destructive/80",
  medium: "text-amber-400/80 dark:text-amber-400/80",
  low: "text-muted-foreground",
}

const DOT_BY_PRIORITY: Record<string, string> = {
  high: "bg-destructive dark:bg-destructive/80",
  medium: "bg-amber-500/80 dark:bg-amber-400/80",
  low: "bg-muted-foreground",
}

interface IProps {
  value: string
  className?: string
}

/** The priority badge: one filled triangle, colored by how urgent the level is. */
export function PriorityChip({ value, className }: IProps) {
  const priority = PRIORITIES.find((p) => p.id === value)
  if (!priority) return null

  return (
    <span
      className={cn(
        "inline-flex items-center",
        CHIP_BY_PRIORITY[priority.id],
        className
      )}
      aria-label={`Priority: ${priority.label}`}
    >
      <Flag className="size-4 fill-current stroke-1 md:size-3.5" />
    </span>
  )
}

/** A small dot marking a card's priority, meant to sit at the end of its title. */
export function PriorityDot({ value, className }: IProps) {
  const priority = PRIORITIES.find((p) => p.id === value)
  if (!priority) return null

  return (
    <span
      className={cn(
        "inline-block size-1.5 shrink-0 rounded-full",
        DOT_BY_PRIORITY[priority.id],
        className
      )}
      aria-label={`Priority: ${priority.label}`}
    />
  )
}
