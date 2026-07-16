import { useEffect, useRef, useState } from "react"
import { cn } from "@doska/ui-kit"
import { normalizePrefix } from "@/lib/api/operations"

interface IProps {
  /** The board's current prefix. */
  prefix: string
  /** Other live boards' prefixes, for the uniqueness check. */
  taken: string[]
  onCommit: (prefix: string) => void
}

/**
 * The board's card-id prefix as an editable chip (the `ROAD` in `ROAD-12`).
 * Clicking flips it to an input; input is normalized to uppercase alnum as you
 * type. Committing a prefix another board already uses is rejected inline —
 * `PREFIX-N` must be unambiguous — and the chip stays open so it can be fixed.
 */
export function PrefixEditor({ prefix, taken, onCommit }: IProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(prefix)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const takenUpper = new Set(taken.filter(Boolean).map((p) => p.toUpperCase()))

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  function open() {
    setDraft(prefix)
    setError(null)
    setEditing(true)
  }

  function commit() {
    const next = normalizePrefix(draft)
    if (!next) {
      setError("Enter a prefix")
      return
    }
    if (next === prefix) {
      setEditing(false)
      return
    }
    if (takenUpper.has(next)) {
      setError(`${next} is taken`)
      return
    }
    onCommit(next)
    setEditing(false)
  }

  function cancel() {
    setDraft(prefix)
    setError(null)
    setEditing(false)
  }

  if (editing) {
    return (
      <span className="relative">
        {error && (
          <span
            role="alert"
            className="mr-4 text-sm whitespace-nowrap text-destructive"
          >
            {error}
          </span>
        )}
        <input
          ref={inputRef}
          value={draft}
          autoFocus
          maxLength={6}
          aria-label="Board prefix"
          aria-invalid={!!error}
          onChange={(e) => {
            setDraft(normalizePrefix(e.target.value))
            setError(null)
          }}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit()
            if (e.key === "Escape") cancel()
          }}
          className={cn(
            "w-20 rounded-sm bg-secondary px-2 py-0.5 font-mono text-sm uppercase outline-none",
            error && "ring-1 ring-destructive"
          )}
        />
      </span>
    )
  }

  if (!prefix) return null

  return (
    <button
      type="button"
      onClick={open}
      title="Click to edit board prefix"
      className="rounded-sm px-2 py-0.5 font-mono text-sm text-muted-foreground hover:text-foreground"
    >
      {prefix}
    </button>
  )
}
