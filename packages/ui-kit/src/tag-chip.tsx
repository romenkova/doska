import { Hash, type LucideIcon } from "lucide-react"
import type { CSSProperties, ReactNode } from "react"
import { cn } from "./lib/cn"

interface IProps {
  label: string
  className?: string
  icon?: LucideIcon
  hue?: number | null
  children?: ReactNode
}

/** Text tinted by a `--tag-h` hue set on an ancestor. */
export const TINT_TEXT =
  "text-[oklch(0.44_0.13_var(--tag-h))] dark:text-[oklch(0.84_0.11_var(--tag-h))]"

export function TagChip({
  label,
  className,
  icon: Icon = Hash,
  hue,
  children,
}: IProps) {
  const isTinted = hue !== undefined && hue !== null
  return (
    <span
      style={isTinted ? ({ "--tag-h": hue } as CSSProperties) : undefined}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-[0.5rem] px-1.5 py-[1px] text-[13px]",
        "text-card-foreground border",
        isTinted
          ? "bg-[oklch(0.72_0.14_var(--tag-h)/0.15)] border-[oklch(0.62_0.15_var(--tag-h)/0.25)]"
          : "bg-primary/10 border-primary/10",
        className
      )}
    >
      <Icon
        className={cn(
          "size-3.5 shrink-0 stroke-[2.5] mt-[1px]",
          isTinted ? TINT_TEXT : "text-primary"
        )}
      />
      <span className="truncate leading-4.5">{label}</span>
      {children}
    </span>
  )
}
