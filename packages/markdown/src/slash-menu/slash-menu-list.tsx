import { cn } from "@doska/ui-kit"
import { useEffect, useRef } from "react"
import type { SlashCommand } from "./commands"

interface IProps {
  items: SlashCommand[]
  onSelect: (command: SlashCommand) => void
  activeIndex?: number
  onHighlight?: (index: number) => void
  className?: string
  style?: React.CSSProperties
}

/**
 * The slash command list popover
 */
export function SlashMenuList({
  items,
  onSelect,
  activeIndex,
  onHighlight,
  className,
  style,
}: IProps) {
  const activeRef = useRef<HTMLButtonElement>(null)

  // Keep the keyboard-highlighted item scrolled into view.
  useEffect(() => {
    if (activeIndex == null) return
    activeRef.current?.scrollIntoView({ block: "nearest" })
  }, [activeIndex])

  return (
    <div
      className={cn(
        "max-h-64 w-60 overflow-y-auto py-1",
        "rounded-lg border bg-popover shadow-md text-popover-foreground",
        className
      )}
      style={style}
      // Keep the textarea focused (caret/keyboard intact) when tapping an item.
      onPointerDown={(e) => e.preventDefault()}
    >
      {items.map((cmd, index) => (
        <button
          key={cmd.id}
          ref={index === activeIndex ? activeRef : undefined}
          type="button"
          onMouseEnter={onHighlight ? () => onHighlight(index) : undefined}
          onClick={() => onSelect(cmd)}
          className={cn(
            "flex w-full items-baseline gap-2 px-3 py-1.5 text-left text-sm",
            index === activeIndex
              ? "bg-accent text-accent-foreground"
              : "active:bg-accent active:text-accent-foreground"
          )}
        >
          <span className="font-medium">{cmd.title}</span>
          {cmd.hint && (
            <span className="text-xs text-muted-foreground">{cmd.hint}</span>
          )}
        </button>
      ))}
    </div>
  )
}
