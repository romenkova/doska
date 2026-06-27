import { cn } from "@doska/ui-kit"
import type { PropsWithChildren } from "react"

export function CardContentLayout({ children }: PropsWithChildren) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col",
        "overflow-y-auto",
        "pb-[max(1rem,env(safe-area-inset-bottom))]"
      )}
    >
      {children}
    </div>
  )
}
