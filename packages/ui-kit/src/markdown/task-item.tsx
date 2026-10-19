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
  function handleLabelClick(event: MouseEvent<HTMLLIElement>) {
    if (!onToggle) return
    const target = event.target as HTMLElement
    if (target.closest("li") !== event.currentTarget) return
    if (target.closest("a, button, input")) return
    if (window.getSelection()?.isCollapsed === false) return
    event.stopPropagation()
    onToggle()
  }

  return (
    <li
      className={cn(
        "relative my-1 pl-1 list-none [&>p]:m-0",
        onToggle && "cursor-pointer",
        checked && "text-muted-foreground/70 dark:text-muted-foreground"
      )}
      onClick={handleLabelClick}
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
