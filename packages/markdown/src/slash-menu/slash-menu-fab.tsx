import { Button } from "@doska/ui-kit"
import { useEffect, useRef, useState } from "react"
import { SlashMenuList } from "./slash-menu-list"
import type { SlashCommand } from "./commands"

interface IProps {
  commands: SlashCommand[]
  onSelect: (command: SlashCommand) => void
}

/**
 * Tracks the on-screen keyboard height (via the visual viewport) so a fixed
 * element can stay above the keyboard instead of hiding behind it.
 */
function useKeyboardInset() {
  const [inset, setInset] = useState(0)

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const onChange = () => {
      const bottom = window.innerHeight - (vv.height + vv.offsetTop)
      setInset(Math.max(0, bottom))
    }
    onChange()
    vv.addEventListener("resize", onChange)
    vv.addEventListener("scroll", onChange)
    return () => {
      vv.removeEventListener("resize", onChange)
      vv.removeEventListener("scroll", onChange)
    }
  }, [])

  return inset
}

/**
 * Mobile replacement for the `/` trigger: a floating slash button that opens a
 * dropdown of slash commands. Selecting one inserts at the textarea caret.
 */
export function SlashMenuFab({ commands, onSelect }: IProps) {
  const [open, setOpen] = useState(false)
  const inset = useKeyboardInset()
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

  return (
    <div
      ref={rootRef}
      className="fixed right-4 z-50"
      style={{ bottom: inset + 16 }}
    >
      {open && (
        <SlashMenuList
          items={commands}
          onSelect={(cmd) => {
            onSelect(cmd)
            setOpen(false)
          }}
          className="absolute right-0 bottom-14"
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
    </div>
  )
}
