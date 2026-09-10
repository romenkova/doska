import type { MouseEvent, ReactNode } from "react"
import { Checkbox } from "../checkbox"
import { cn } from "../lib/cn"

function stopPropagation(event: MouseEvent) {
  event.stopPropagation()
}

/** A GFM task-list item*/
export function MdTaskItem({
  checked,
  onToggle,
  label,
  children,
}: {
  checked: boolean
  /** Absent when the checkbox is not interactive. */
  onToggle?: () => void
  label?: string
  children: ReactNode
}) {
  return (
    <li
      className={cn(
        "relative my-[0.2rem] pl-1 list-none [&>p]:m-0",
        checked && "text-muted-foreground/70 dark:text-muted-foreground"
      )}
    >
      {/* The item may sit inside a card's open-detail handler. */}
      <span className="contents" onClick={stopPropagation}>
        <Checkbox
          aria-label={label ?? "Checkbox"}
          checked={checked}
          readOnly={!onToggle}
          className={cn(
            "absolute top-[0.3em] -left-5 flex",
            onToggle && "cursor-pointer"
          )}
          onCheckedChange={onToggle}
        />
      </span>
      {children}
    </li>
  )
}
