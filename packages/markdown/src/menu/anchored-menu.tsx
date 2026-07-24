import { useLayoutEffect, useRef, useState } from "react"
import { MenuList } from "./menu-list"
import type { MenuItem } from "./menu-item"

interface IProps<T extends MenuItem> {
  items: T[]
  activeIndex: number
  /** Caret line, in wrapper coords: left edge and the line's top/bottom. */
  left: number
  top: number
  bottom: number
  onSelect: (item: T) => void
  onHighlight: (index: number) => void
}

// Gap between the caret line and a menu that had to open upward.
const FLIP_GAP = 4

/**
 * A caret-anchored dropdown that opens below the caret, or flips above it when
 * a long list would run off the bottom of the screen and there's more room up
 * top. Shared by the `/` and `[[` menus.
 */
export function AnchoredMenu<T extends MenuItem>({
  items,
  activeIndex,
  left,
  top,
  bottom,
  onSelect,
  onHighlight,
}: IProps<T>) {
  const ref = useRef<HTMLDivElement>(null)
  const [above, setAbove] = useState(false)

  useLayoutEffect(() => {
    const el = ref.current
    const parent = el?.offsetParent
    if (!el || !parent) return
    const parentTop = parent.getBoundingClientRect().top
    const spaceBelow = window.innerHeight - (parentTop + bottom)
    const spaceAbove = parentTop + top
    setAbove(el.offsetHeight > spaceBelow && spaceAbove > spaceBelow)
  }, [top, bottom, left, items.length])

  const style = above
    ? { left, top: top - FLIP_GAP, transform: "translateY(-100%)" }
    : { left, top: bottom }

  return (
    <MenuList
      ref={ref}
      items={items}
      activeIndex={activeIndex}
      onSelect={onSelect}
      onHighlight={onHighlight}
      className="absolute z-50"
      style={style}
    />
  )
}
