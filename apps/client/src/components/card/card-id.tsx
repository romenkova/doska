import { useEffect, useRef, useState } from "react"
import { cn } from "@doska/ui-kit"
import { Check, Hash } from "lucide-react"

/**
 * The card's human-readable id (`ROAD-12`) as a click-to-copy chip. Copying is
 * a leaf action on the card, so the click is stopped from bubbling to the
 * card's open-detail handler. Briefly swaps to a check to confirm the copy.
 */
export function CardId({ id, className }: { id: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  async function copy(e: React.MouseEvent) {
    e.stopPropagation()
    await navigator.clipboard?.writeText(id)
    setCopied(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), 1000)
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy card id ${id}`}
      title="Copy id"
      className={cn(
        "group/id inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5",
        "font-mono text-xs font-normal text-muted-foreground",
        "hover:text-foreground",
        className
      )}
    >
      {copied ? (
        <>
          <Check className="size-3.5" />
          <span>copied</span>
        </>
      ) : (
        <>
          <Hash className="size-3.5" />
          <span>{id}</span>
        </>
      )}
    </button>
  )
}
