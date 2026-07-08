import { useEffect, useRef, useState } from "react"
import { cn, InvisibleInput } from "@doska/ui-kit"

interface IProps {
  value: string
  onCommit: (next: string) => void
  /** Accessible name for the edit input. */
  label: string
  /** Extra classes applied to both the display and edit states, so sizing and
   *  typography stay identical as the title flips between them. */
  className?: string
}

/**
 * A title that flips to an inline input on click and commits on blur/Enter.
 * Shared by the board name and column titles so they edit the same way.
 */
export function EditableTitle({ value, onCommit, label, className }: IProps) {
  const [editing, setEditing] = useState(false)
  // The shown text. Kept locally so a committed rename displays immediately,
  // instead of flashing the stale `value` while the mutation round-trips.
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  // Adopt external changes (a refetch, or another client's edit) only when
  // `value` genuinely changes — never on our own commit, where it's still
  // stale — and not while a draft is being typed.
  const [lastValue, setLastValue] = useState(value)
  if (lastValue !== value) {
    setLastValue(value)
    if (!editing) setDraft(value)
  }

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  function startEditing() {
    setDraft(value)
    setEditing(true)
  }

  function commit() {
    const next = draft.trim()
    if (next && next !== value) {
      setDraft(next)
      onCommit(next)
    } else {
      setDraft(value)
    }
    setEditing(false)
  }

  function cancel() {
    setDraft(value)
    setEditing(false)
  }

  if (editing) {
    return (
      <InvisibleInput
        ref={inputRef}
        value={draft}
        autoFocus
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit()
          if (e.key === "Escape") cancel()
        }}
        aria-label={label}
        className={className}
      />
    )
  }

  return (
    <span
      onClick={startEditing}
      title="Click to rename"
      className={cn("line-clamp-1 cursor-text px-2", className)}
    >
      {draft}
    </span>
  )
}
