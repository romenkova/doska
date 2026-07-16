import { DateInput, cn } from "@doska/ui-kit"
import { DeadlineChip } from "./deadline-chip"

interface IProps {
  value: string | null
  onChange?: (value: string | null) => void
  className?: string
}

/** Card deadline as a color-coded chip. */
export function CardDeadline({ value, onChange, className }: IProps) {
  return (
    <span onClick={(e) => e.stopPropagation()} className="inline-flex">
      <DateInput
        value={value}
        onChange={onChange}
        className={cn("cursor-pointer items-center gap-1.5", className)}
      >
        <DeadlineChip value={value} />
      </DateInput>
    </span>
  )
}
