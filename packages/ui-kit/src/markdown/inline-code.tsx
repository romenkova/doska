import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react"
import { cn } from "../lib/cn"

export function MdInlineCode({ children }: { children: string }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  async function copy(e: MouseEvent | KeyboardEvent) {
    // The code may sit inside a card's open-detail handler.
    e.stopPropagation()
    await navigator.clipboard?.writeText(children)
    setCopied(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), 1000)
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key !== "Enter" && e.key !== " ") return
    e.preventDefault()
    void copy(e)
  }

  return (
    <code
      role="button"
      tabIndex={0}
      title={copied ? "Copied" : "Copy"}
      onClick={copy}
      onKeyDown={onKeyDown}
      className={cn(
        "relative cursor-pointer rounded-[0.5rem] border border-border bg-muted/70 px-[0.35em] py-[0.1em] font-mono text-[0.8125em]",
        "transition-colors hover:border-primary/50",
        copied && "border-primary/60 bg-primary/10"
      )}
    >
      {children}
      {copied && (
        <span
          aria-live="polite"
          className="absolute bottom-[calc(100%+0.35em)] left-1/2 -translate-x-1/2 rounded-sm bg-foreground px-1.5 py-0.5 font-sans text-[0.6875rem] whitespace-nowrap text-background"
        >
          Copied
        </span>
      )}
    </code>
  )
}
