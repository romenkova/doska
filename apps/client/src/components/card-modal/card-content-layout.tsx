import { cn } from "@doska/ui-kit"
import type { ComponentProps } from "react"

export function CardContentLayout({
  children,
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      {...props}
      className={cn(
        "flex min-h-0 flex-1 flex-col",
        "overflow-y-auto",
        "pb-[max(1rem,env(safe-area-inset-bottom))]",
        className
      )}
    >
      {children}
    </div>
  )
}
