import type { CSSProperties } from "react"
import { cn, columnHue } from "@doska/ui-kit"

interface IProps {
  title: string
  color: string
  className?: string
}

/**
 * A column as a pill tinted with its own color
 */
export function ColumnTag({ title, color, className }: IProps) {
  const hue = columnHue(color)
  return (
    <span
      style={hue === null ? undefined : ({ "--tag-h": hue } as CSSProperties)}
      className={cn(
        "shrink-0 rounded-full px-2 py-0.5 whitespace-nowrap",
        "text-xs font-semibold tracking-[0.02em] uppercase",
        hue === null
          ? "bg-muted text-muted-foreground"
          : [
              "bg-[oklch(0.95_0.05_var(--tag-h))] text-[oklch(0.44_0.13_var(--tag-h))]",
              "dark:bg-[oklch(0.62_0.14_var(--tag-h)/0.24)] dark:text-[oklch(0.84_0.11_var(--tag-h))]",
            ],
        className
      )}
    >
      {title}
    </span>
  )
}
