import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import { getCaretCoords } from "./caret-position"
import {
  DEFAULT_SLASH_COMMANDS,
  filterSlashCommands,
  type SlashCommand,
} from "./commands"

// A `/` at the start of input or right after whitespace, followed by the query
// (any non-whitespace run) up to the caret.
const TRIGGER_RE = /(^|\s)\/(\S*)$/

// Keys the open menu consumes; their keyup must not re-sync, which would reset
// the highlighted item back to 0.
const NAV_KEYS = ["ArrowDown", "ArrowUp", "Enter", "Tab", "Escape"]

interface SlashMenuState {
  /** Index of the triggering `/` in the value. */
  triggerStart: number
  items: SlashCommand[]
  left: number
  top: number
}

interface Options {
  value: string
  onChangeValue: (value: string) => void
  commands?: SlashCommand[]
  enabled?: boolean
}

/** Splits an `insert` template on the `$` caret sentinel. */
function applyInsert(insert: string): { text: string; caretOffset: number } {
  const i = insert.indexOf("$")
  if (i === -1) return { text: insert, caretOffset: insert.length }
  return { text: insert.slice(0, i) + insert.slice(i + 1), caretOffset: i }
}

/**
 * Drives a slash command menu for an existing textarea (referenced by `ref`):
 * detects the `/` trigger, measures the caret to position the dropdown, handles
 * keyboard navigation, and inserts the chosen command. Binds its own listeners
 * to the textarea, so the caller only renders the dropdown from the state here.
 */
export function useSlashMenu(
  ref: React.RefObject<HTMLTextAreaElement | null>,
  {
    value,
    onChangeValue,
    commands = DEFAULT_SLASH_COMMANDS,
    enabled = true,
  }: Options
) {
  const [menu, setMenu] = useState<SlashMenuState | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  // Caret position to restore after a controlled value update lands.
  const pendingCaret = useRef<number | null>(null)
  // Value at which Escape dismissed the menu; keeps it shut until the text changes.
  const dismissedValue = useRef<string | null>(null)

  const close = useCallback(() => setMenu(null), [])

  /** Re-evaluates the trigger from the current caret and updates menu state. */
  const sync = useCallback(() => {
    const textarea = ref.current
    if (!textarea || textarea.selectionStart !== textarea.selectionEnd)
      return setMenu(null)

    if (dismissedValue.current === textarea.value) return setMenu(null)
    dismissedValue.current = null

    const caret = textarea.selectionStart
    const before = textarea.value.slice(0, caret)
    const match = TRIGGER_RE.exec(before)
    if (!match) return setMenu(null)

    const query = match[2]
    const triggerStart = caret - query.length - 1
    // Block commands only apply on a fresh line: nothing but whitespace before
    // the `/` since the previous line break.
    const lineStart = before.lastIndexOf("\n", triggerStart - 1) + 1
    const atLineStart = before.slice(lineStart, triggerStart).trim() === ""
    const items = filterSlashCommands(commands, query, atLineStart)
    if (items.length === 0) return setMenu(null)

    const { left, top, height } = getCaretCoords(textarea, triggerStart)
    setMenu({ triggerStart, items, left, top: top + height })
    setActiveIndex(0)
  }, [ref, commands])

  const select = useCallback(
    (command: SlashCommand) => {
      const textarea = ref.current
      if (!textarea || !menu) return
      const { text, caretOffset } = applyInsert(command.insert)
      const next =
        textarea.value.slice(0, menu.triggerStart) +
        text +
        textarea.value.slice(textarea.selectionStart)
      pendingCaret.current = menu.triggerStart + caretOffset
      onChangeValue(next)
      setMenu(null)
    },
    [ref, menu, onChangeValue]
  )

  /**
   * Inserts a command at the current caret, without a typed `/` trigger (used
   * by the mobile floating menu). Block commands are pushed onto a fresh line
   * when the caret sits mid-line, so the markdown stays valid.
   */
  const insertCommand = useCallback(
    (command: SlashCommand) => {
      const textarea = ref.current
      if (!textarea) return
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const v = textarea.value
      const scope = command.scope ?? "block"
      const atLineStart = start === 0 || v[start - 1] === "\n"
      const prefix = scope === "block" && !atLineStart ? "\n" : ""
      const { text, caretOffset } = applyInsert(command.insert)
      const next = v.slice(0, start) + prefix + text + v.slice(end)
      pendingCaret.current = start + prefix.length + caretOffset
      onChangeValue(next)
    },
    [ref, onChangeValue]
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

  return { menu, activeIndex, select, setActiveIndex, insertCommand }
}
