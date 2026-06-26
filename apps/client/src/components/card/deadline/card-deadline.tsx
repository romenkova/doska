import { cn } from "@doska/ui-kit"
import { Calendar, X } from "lucide-react"
import { deadlineLabel } from "@/lib/utils"
import { DeadlineChip } from "./deadline-chip"

interface IProps {
  value: string | null
  onChange?: (value: string | null) => void
  /**
   * - `chip`: rounded badge, colored by how close the deadline is.
   * - `field`: a dashed input row, for the editor under the title.
   */
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
      <label
        className={cn(
          "flex w-fit items-center gap-2 border-b-2 border-dashed py-3 font-mono text-sm",
          "text-muted-foreground focus-within:text-foreground",
          className
        )}
      >
        <Calendar className="size-4 shrink-0" />
        <input
          type="date"
          value={value ?? ""}
          onChange={(e) => onChange?.(e.target.value || null)}
          onClick={(e) => e.currentTarget.showPicker?.()}
          className={cn(
            "bg-transparent outline-none",
            "[&::-webkit-calendar-picker-indicator]:hidden"
          )}
        />
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
      </label>
    )
  }

  if (!value) return null

  return (
    <label
      className={cn(
        "relative inline-flex cursor-pointer items-center gap-1.5",
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <DeadlineChip value={value} />
      <span className="text-xs text-muted-foreground">
        {deadlineLabel(value)}
      </span>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange?.(e.target.value || null)}
        onClick={(e) => e.currentTarget.showPicker?.()}
        className="absolute inset-0 cursor-pointer opacity-0"
      />
    </label>
  )
}
