import { cn } from "@/lib/utils"
import type { PropsWithChildren } from "react"

export function CardContentLayout({ children }: PropsWithChildren) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-1",
        "overflow-y-auto px-4 pt-3",
        "pb-[max(1rem,env(safe-area-inset-bottom))]"
      )}
    >
      {children}
    </div>
  )
}
