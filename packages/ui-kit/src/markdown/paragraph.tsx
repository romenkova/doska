import type { ReactNode } from "react"
import { cn } from "../lib/cn"

export function MdParagraph({
  children,
  muted,
}: {
  children: ReactNode
  /** Inside a ticked task, whose text is dimmed. */
  muted?: boolean
}) {
  return (
    <p className={cn("my-3", muted && "text-muted-foreground")}>{children}</p>
  )
}
