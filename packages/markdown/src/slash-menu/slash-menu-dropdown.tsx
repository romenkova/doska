import { cn } from "@doska/ui-kit"
import { useEffect, useRef } from "react"
import type { SlashCommand } from "./commands"

interface IProps {
  items: SlashCommand[]
  activeIndex: number
  /** Position of the dropdown's top-left, relative to the textarea wrapper. */
  left: number
  top: number
  onSelect: (command: SlashCommand) => void
  onHighlight: (index: number) => void
}

export function SlashMenuDropdown({
  items,
  activeIndex,
  left,
  top,
  onSelect,
  onHighlight,
}: IProps) {
  const activeRef = useRef<HTMLButtonElement>(null)

  // Keep the keyboard-highlighted item scrolled into view.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" })
  }, [activeIndex])

  return (
    <div
      className={cn(
        "absolute z-50 max-h-64 w-60 overflow-y-auto py-1",
        "rounded-lg border bg-popover shadow-md",
        "text-popover-foreground"
      )}
      style={{ left, top }}
      // Prevent the textarea from losing focus when clicking an item.
      onMouseDown={(e) => e.preventDefault()}
    >
      {items.map((cmd, index) => (
        <button
          key={cmd.id}
          ref={index === activeIndex ? activeRef : undefined}
          type="button"
          onMouseEnter={() => onHighlight(index)}
          onClick={() => onSelect(cmd)}
          className={cn(
            "flex w-full items-baseline gap-2 px-3 py-1.5 text-left text-sm",
            index === activeIndex && "bg-accent text-accent-foreground"
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
