import { Hash, type LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import { cn } from "./lib/cn"

interface IProps {
  label: string
  className?: string
  icon?: LucideIcon
  children?: ReactNode
}

export function TagChip({
  label,
  className,
  icon: Icon = Hash,
  children,
}: IProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-[0.5rem] px-1.5 py-[1px] text-[13px]",
        "bg-primary/10 text-card-foreground border border-primary/10",
        className
      )}
    >
      <Icon className="size-3.5 shrink-0 stroke-[2.5] text-primary mt-[1px]" />
      <span className="truncate leading-4.5">{label}</span>
      {children}
    </span>
  )
}
