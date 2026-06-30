import { DateInput, cn } from "@doska/ui-kit"
import { Calendar, X } from "lucide-react"
import { deadlineLabel, formatDeadline } from "@/lib/utils"
import { DeadlineChip } from "./deadline-chip"

interface IProps {
  value: string | null
  onChange?: (value: string | null) => void
  variant?: "chip" | "field"
  className?: string
}

/** Card deadline: a color-coded chip, or a dashed field in the editor. */
export function CardDeadline({
  value,
  onChange,
  variant = "chip",
  className,
}: IProps) {
  if (variant === "field") {
    return (
      <div
        className={cn(
          "flex w-fit items-center gap-2 py-3 font-mono text-sm",
          "text-muted-foreground",
          className
        )}
      >
        <DateInput
          value={value}
          onChange={onChange}
          className="items-center gap-2 hover:text-foreground"
        >
          <Calendar className="size-4 shrink-0" />
          <span>{value ? formatDeadline(value) : "Set deadline"}</span>
        </DateInput>
        {value && (
          <button
            type="button"
            aria-label="Remove deadline"
            onClick={() => onChange?.(null)}
            className="shrink-0 rounded-full p-0.5 hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
    )
  }

  if (!value) return null

  return (
    <span onClick={(e) => e.stopPropagation()} className="inline-flex">
      <DateInput
        value={value}
        onChange={onChange}
        className={cn("cursor-pointer items-center gap-1.5", className)}
      >
        <DeadlineChip value={value} />
        <span className="text-xs text-muted-foreground">
          {deadlineLabel(value)}
        </span>
      </DateInput>
    </span>
  )
}
