import { cn } from "./lib/cn"
import { Circle, CircleCheck } from "lucide-react"

interface IProps {
  done: number
  total: number
}

export function TaskIndicator({ done, total }: IProps) {
  const complete = done === total
  const Icon = complete ? CircleCheck : Circle
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 font-mono",
        "text-xs text-muted-foreground tabular-nums"
        // complete
        //   ? "bg-success text-success-foreground"
        //   : "text-muted-foreground"
      )}
    >
      <Icon className="size-3.5" />
      <span className="mt-px">
        {done}/{total}
      </span>
    </span>
  )
}
