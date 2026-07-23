import { DateInput, DeadlineChip, cn } from "@doska/ui-kit"

interface IProps {
  value: string | null
  onChange?: (value: string | null) => void
  className?: string
  done: boolean
}

/** Card deadline as a color-coded chip. */
export function CardDeadline({ value, onChange, className, done }: IProps) {
  return (
    <span onClick={(e) => e.stopPropagation()} className="inline-flex">
      <DateInput
        value={value}
        onChange={onChange}
        className={cn("cursor-pointer items-center gap-1.5", className)}
      >
        <DeadlineChip done={done} value={value} />
      </DateInput>
    </span>
  )
}
