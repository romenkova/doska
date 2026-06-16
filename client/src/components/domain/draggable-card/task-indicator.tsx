import { cn } from "@/lib/utils"
import { CircleCheck, ListChecks } from "lucide-react"

interface IProps {
  done: number
  total: number
}

export function TaskIndicator({ done, total }: IProps) {
  const complete = done === total
  const Icon = complete ? CircleCheck : ListChecks
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5",
        "text-xs font-medium tabular-nums",
        complete
          ? "bg-success text-success-foreground"
          : "bg-muted text-muted-foreground"
      )}
    >
      <Icon className="size-3.5" />
      {done}/{total}
    </span>
  )
}
