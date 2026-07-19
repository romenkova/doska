import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import { getCaretCoords } from "./caret-position"
import type { MenuItem } from "./menu-item"

// Keys the open menu consumes; their keyup must not re-sync, which would reset
// the highlighted item back to 0.
const NAV_KEYS = ["ArrowDown", "ArrowUp", "Enter", "Tab", "Escape"]

interface MenuState<T> {
  /** Index in the value where the trigger sequence starts. */
  triggerStart: number
  items: T[]
  left: number
  top: number
}

/** Text to splice in, and where the caret should land inside it. */
export interface Insertion {
  text: string
  caretOffset: number
}

interface Options<T extends MenuItem> {
  value: string
  onChangeValue: (value: string) => void
  enabled?: boolean
  /**
   * Matches the trigger sequence plus its query, anchored to the caret. Capture
   * group 1 is the query.
   */
  trigger: RegExp
  /** Characters the trigger itself occupies before the query (`/` → 1, `[[` → 2). */
  triggerLength: number
  /** Items to offer for the current query. Returning none closes the menu. */
  getItems: (query: string, context: { atLineStart: boolean }) => T[]
  /** What replaces the trigger and query when an item is chosen. */
  toInsert: (item: T) => Insertion
}

/**
 * Drives a caret-triggered menu over an existing textarea (referenced by
 * `ref`): detects the trigger, measures the caret to position the dropdown,
 * handles keyboard navigation, and splices in the chosen item. Binds its own
 * listeners to the textarea, so the caller only renders the dropdown from the
 * state returned here.
 */
export function useTriggerMenu<T extends MenuItem>(
  ref: React.RefObject<HTMLTextAreaElement | null>,
  {
    value,
    onChangeValue,
    enabled = true,
    trigger,
    triggerLength,
    getItems,
    toInsert,
  }: Options<T>
) {
  const [menu, setMenu] = useState<MenuState<T> | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  // Caret position to restore after a controlled value update lands.
  const pendingCaret = useRef<number | null>(null)
  // Value at which Escape dismissed the menu; keeps it shut until the text changes.
  const dismissedValue = useRef<string | null>(null)

  const close = useCallback(() => setMenu(null), [])

  /** Splices text over a range and queues the caret to land inside it. */
  const spliceAt = useCallback(
    (start: number, end: number, { text, caretOffset }: Insertion) => {
      const textarea = ref.current
      if (!textarea) return
      const next =
        textarea.value.slice(0, start) + text + textarea.value.slice(end)
      pendingCaret.current = start + caretOffset
      onChangeValue(next)
    },
    [ref, onChangeValue]
  )

  /** Re-evaluates the trigger from the current caret and updates menu state. */
  const sync = useCallback(() => {
    const textarea = ref.current
    if (!textarea || textarea.selectionStart !== textarea.selectionEnd)
      return setMenu(null)

    if (dismissedValue.current === textarea.value) return setMenu(null)
    dismissedValue.current = null

    const caret = textarea.selectionStart
    const before = textarea.value.slice(0, caret)
    const match = trigger.exec(before)
    if (!match) return setMenu(null)

    const query = match[1]
    const triggerStart = caret - query.length - triggerLength
    // Nothing but whitespace since the previous line break puts the trigger at
    // the start of its line, which some items require.
    const lineStart = before.lastIndexOf("\n", triggerStart - 1) + 1
    const atLineStart = before.slice(lineStart, triggerStart).trim() === ""
    const items = getItems(query, { atLineStart })
    if (items.length === 0) return setMenu(null)

    const { left, top, height } = getCaretCoords(textarea, triggerStart)
    setMenu({ triggerStart, items, left, top: top + height })
    setActiveIndex(0)
  }, [ref, trigger, triggerLength, getItems])

  const select = useCallback(
    (item: T) => {
      const textarea = ref.current
      if (!textarea || !menu) return
      spliceAt(menu.triggerStart, textarea.selectionStart, toInsert(item))
      setMenu(null)
    },
    [ref, menu, spliceAt, toInsert]
  )

  const onKeyUp = useCallback(
    (e: KeyboardEvent) => {
      if (menu && NAV_KEYS.includes(e.key)) return
      sync()
    },
    [menu, sync]
  )

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!menu) return
      const { length } = menu.items
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          setActiveIndex((i) => (i + 1) % length)
          break
        case "ArrowUp":
          e.preventDefault()
          setActiveIndex((i) => (i - 1 + length) % length)
          break
        case "Enter":
        case "Tab":
          e.preventDefault()
          select(menu.items[activeIndex])
          break
        case "Escape":
          e.preventDefault()
          // Stop the panel's window-level Escape from also firing and closing the whole card.
          e.stopPropagation()
          dismissedValue.current = ref.current?.value ?? null
          setMenu(null)
          break
      }
    },
    [ref, menu, activeIndex, select]
  )

  // Bind to the textarea: typing/clicks re-evaluate the trigger, keys navigate.
  useEffect(() => {
    const textarea = ref.current
    if (!textarea || !enabled) return
    textarea.addEventListener("input", sync)
    textarea.addEventListener("keyup", onKeyUp)
    textarea.addEventListener("click", sync)
    textarea.addEventListener("keydown", onKeyDown)
    textarea.addEventListener("blur", close)
    return () => {
      textarea.removeEventListener("input", sync)
      textarea.removeEventListener("keyup", onKeyUp)
      textarea.removeEventListener("click", sync)
      textarea.removeEventListener("keydown", onKeyDown)
      textarea.removeEventListener("blur", close)
    }
  }, [ref, enabled, sync, onKeyUp, onKeyDown, close])

  // After the controlled value updates from an insertion, restore the caret.
  useLayoutEffect(() => {
    if (pendingCaret.current === null) return
    const textarea = ref.current
    if (textarea) {
      textarea.focus()
      textarea.setSelectionRange(pendingCaret.current, pendingCaret.current)
    }
    pendingCaret.current = null
  }, [ref, value])

  return { menu, activeIndex, select, setActiveIndex, spliceAt }
}
