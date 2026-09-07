import { cn } from "@doska/ui-kit"
import { useEffect, useRef } from "react"
import type { MenuItem } from "./menu-item"

interface IProps<T extends MenuItem> {
  items: T[]
  onSelect: (item: T) => void
  activeIndex?: number
  onHighlight?: (index: number) => void
  className?: string
  style?: React.CSSProperties
  ref?: React.Ref<HTMLDivElement>
}

/**
 * The popover list shared by the caret-triggered menus — `/` commands and `[[`
 * card refs.
 */
export function MenuList<T extends MenuItem>({
  items,
  onSelect,
  activeIndex,
  onHighlight,
  className,
  style,
  ref,
}: IProps<T>) {
  const activeRef = useRef<HTMLButtonElement>(null)

  // Keep the keyboard-highlighted item scrolled into view.
  useEffect(() => {
    if (activeIndex == null) return
    activeRef.current?.scrollIntoView({ block: "nearest" })
  }, [activeIndex])

  return (
    <div
      ref={ref}
      className={cn(
        "max-h-(--menu-max-height,16rem) w-70 overflow-y-auto py-1",
        "rounded-lg border bg-popover/60 text-popover-foreground shadow-e3 backdrop-blur-md",
        className
      )}
      style={style}
      // Keep the textarea focused (caret/keyboard intact) when tapping an item.
      onPointerDown={(e) => e.preventDefault()}
    >
      {items.map((item, index) => (
        <button
          key={item.id}
          ref={index === activeIndex ? activeRef : undefined}
          type="button"
          onMouseEnter={onHighlight ? () => onHighlight(index) : undefined}
          onClick={() => onSelect(item)}
          className={cn(
            "flex w-full items-baseline gap-2 px-3 py-1.5 text-left text-sm",
            index === activeIndex
              ? "bg-accent text-accent-foreground"
              : "active:bg-accent active:text-accent-foreground"
          )}
        >
          <span className="line line-clamp-1 max-w-60 font-medium">
            {item.title}
          </span>
          {item.hint && (
            <span className="shrink-0 text-xs text-muted-foreground">
              {item.hint}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
