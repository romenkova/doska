import { useState } from "react"
import { Button, cn, Input } from "@doska/ui-kit"
import { normalizePrefix } from "@/lib/api/operations"

interface IProps {
  /** The board's current prefix. */
  prefix: string
  /** Other live boards' prefixes, for the uniqueness check. */
  taken: string[]
  onCommit: (prefix: string) => void
}

/**
 * Settings section for the board's card-id prefix (the `ROAD` in `ROAD-12`).
 * Input is normalized to uppercase alnum as you type. A prefix another board
 * already uses is rejected inline — `PREFIX-N` must be unambiguous.
 */
export function PrefixSection({ prefix, taken, onCommit }: IProps) {
  const [draft, setDraft] = useState(prefix)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const takenUpper = new Set(taken.filter(Boolean).map((p) => p.toUpperCase()))

  function commit() {
    const next = normalizePrefix(draft)
    if (!next) {
      setError("Enter a prefix")
      return
    }
    if (next === prefix) return
    if (takenUpper.has(next)) {
      setError(`${next} is taken`)
      return
    }
    onCommit(next)
    setSaved(true)
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">Prefix</span>
      <span className="text-xs text-muted-foreground">
        The short code prefixed onto every card id, like the{" "}
        <span className="font-mono">ROAD</span> in{" "}
        <span className="font-mono">ROAD-12</span>.
      </span>
      <div className="mt-1 flex items-center gap-2">
        <Input
          value={draft}
          maxLength={6}
          aria-label="Board prefix"
          aria-invalid={!!error}
          onChange={(e) => {
            setDraft(normalizePrefix(e.target.value))
            setError(null)
            setSaved(false)
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit()
          }}
          className={cn("font-mono uppercase", error && "border-destructive")}
        />
        <Button
          size="sm"
          onClick={commit}
          disabled={normalizePrefix(draft) === prefix}
        >
          Save
        </Button>
      </div>
      {error ? (
        <span role="alert" className="text-sm text-destructive">
          {error}
        </span>
      ) : (
        saved && <span className="text-xs text-muted-foreground">Saved.</span>
      )}
    </div>
  )
}
