import { Button } from "@doska/ui-kit"
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import type { EditorView } from "@codemirror/view"
import {
  DEFAULT_SLASH_COMMANDS,
  untriggeredInsert,
  type SlashCommand,
} from "@doska/markdown"
import { SlashCommandList } from "./slash-command-list"

interface IProps {
  view: EditorView | null
  commands?: SlashCommand[]
  /** Non-scrolling, positioned ancestor to render into. */
  container?: HTMLElement | null
}

// The menu's bottom offset plus breathing room from the container's top edge,
// so the menu can never grow past either end.
const MENU_CHROME = "5rem"

/**
 * Mobile replacement for the `/` trigger: a floating slash button that opens a
 * list of slash commands. Selecting one inserts at the editor caret.
 *
 * Positioned against `container`, not the viewport: the app shell is already
 * sized to the visible area (`--app-height`), so sitting at the container's
 * bottom edge means sitting above the keyboard, with no measuring involved.
 */
export function SlashMenuFab({
  view,
  commands = DEFAULT_SLASH_COMMANDS,
  container,
}: IProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  // Close when tapping anywhere outside the button or its menu.
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("pointerdown", onDown)
    return () => document.removeEventListener("pointerdown", onDown)
  }, [open])

  function insert(command: SlashCommand) {
    setOpen(false)
    if (!view) return
    const { from, to } = view.state.selection.main
    const { text, caretOffset } = untriggeredInsert(
      command,
      view.state.doc.toString(),
      from
    )
    view.dispatch({
      changes: { from, to, insert: text },
      selection: { anchor: from + caretOffset },
      userEvent: "input",
    })
    view.focus()
  }

  // Spans the container so the menu's `max-height` percentage measures against
  // the visible pane; `pointer-events-none` keeps the overlay tappable-through,
  // which is also what makes the outside-click check above work.
  const fab = (
    <div ref={rootRef} className="pointer-events-none absolute inset-0 z-50">
      {open && (
        <SlashCommandList
          commands={commands}
          onSelect={insert}
          className="pointer-events-auto absolute right-4 bottom-18"
          style={{ maxHeight: `min(16rem, calc(100% - ${MENU_CHROME}))` }}
        />
      )}
      <Button
        size="icon-lg"
        variant={open ? "default" : "secondary"}
        aria-label="Insert command"
        onPointerDown={(e) => e.preventDefault()}
        onClick={() => setOpen((o) => !o)}
        className="pointer-events-auto absolute right-4 bottom-4 size-11 text-2xl font-semibold shadow-e2"
      >
        /
      </Button>
    </div>
  )

  return container ? createPortal(fab, container) : fab
}
