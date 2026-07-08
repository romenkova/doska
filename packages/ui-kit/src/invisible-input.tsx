import { useEffect, useRef, useState } from "react"
import { cn } from "./lib/cn"

interface IProps {
  value: string
  onCommit: (next: string) => void
  /** Accessible name for the edit input. */
  label: string
  /** Extra classes applied to both display and edit states, so sizing and
   *  typography stay identical as the field flips between them. */
  className?: string
  placeholder?: string
  /** Hint shown on the display element. */
  title?: string
  /** Commit an empty value instead of reverting to the previous one. */
  allowEmpty?: boolean
}

/**
 * A value that flips to an inline input on click and commits on blur/Enter
 * (Escape cancels). Owns its editing state and a local draft, so a committed
 * edit shows immediately instead of flashing the stale `value` while the
 * mutation round-trips. Shared by titles and the attachment name.
 */
export function InvisibleInput({
  value,
  onCommit,
  label,
  className,
  placeholder,
  title = "Click to edit",
  allowEmpty = false,
}: IProps) {
  const [editing, setEditing] = useState(false)
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
    if (next !== value && (allowEmpty || next)) {
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
      <input
        ref={inputRef}
        value={draft}
        autoFocus
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit()
          if (e.key === "Escape") cancel()
        }}
        aria-label={label}
        className={cn(
          className,
          "bg-transparent outline-none",
          "placeholder:text-muted-foreground/50",
          "rounded-sm bg-secondary px-2 py-0.5"
        )}
      />
    )
  }

  return (
    <span
      onClick={startEditing}
      title={title}
      className={cn("line-clamp-1 cursor-text px-2", className)}
    >
      {draft || <span className="text-muted-foreground/50">{placeholder}</span>}
    </span>
  )
}
