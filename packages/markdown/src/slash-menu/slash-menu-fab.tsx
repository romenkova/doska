import { Button } from "@doska/ui-kit"
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { MenuList } from "../menu"
import type { SlashCommand } from "./commands"

interface IProps {
  commands: SlashCommand[]
  onSelect: (command: SlashCommand) => void
}

// Space the FAB and its opened menu occupy below the menu's top edge: the
// button, the gap above it, and a little breathing room from the viewport top.
const MENU_CHROME = 96

/**
 * Tracks the on-screen keyboard (via the visual viewport) so a fixed element
 * can stay above it: `inset` is the keyboard height, `menuMaxHeight` is how
 * tall the opened menu may be without running under the keyboard.
 */
function useKeyboardViewport() {
  const [inset, setInset] = useState(0)
  const [visibleHeight, setVisibleHeight] = useState(0)

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const onChange = () => {
      const bottom = window.innerHeight - (vv.height + vv.offsetTop)
      setInset(Math.max(0, bottom))
      setVisibleHeight(vv.height)
    }
    onChange()
    vv.addEventListener("resize", onChange)
    vv.addEventListener("scroll", onChange)
    return () => {
      vv.removeEventListener("resize", onChange)
      vv.removeEventListener("scroll", onChange)
    }
  }, [])

  // Cap at the design default; only shrink when the keyboard leaves less room.
  const menuMaxHeight = Math.max(160, Math.min(256, visibleHeight - MENU_CHROME))
  return { inset, menuMaxHeight }
}

/**
 * Mobile replacement for the `/` trigger: a floating slash button that opens a
 * dropdown of slash commands. Selecting one inserts at the textarea caret.
 */
export function SlashMenuFab({ commands, onSelect }: IProps) {
  const [open, setOpen] = useState(false)
  const { inset, menuMaxHeight } = useKeyboardViewport()
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

  return createPortal(
    <div
      ref={rootRef}
      className="fixed right-4 z-50"
      style={{ bottom: inset + 16 }}
    >
      {open && (
        <MenuList
          items={commands}
          onSelect={(cmd) => {
            onSelect(cmd)
            setOpen(false)
          }}
          className="absolute right-0 bottom-14"
          style={{ maxHeight: menuMaxHeight }}
        />
      )}
      <Button
        size="icon-lg"
        variant={open ? "default" : "secondary"}
        aria-label="Insert command"
        onPointerDown={(e) => e.preventDefault()}
        onClick={() => setOpen((o) => !o)}
        className="size-11 text-2xl font-semibold shadow-lg"
      >
        /
      </Button>
    </div>,
    document.body
  )
}
