import { cn, columnHue } from "@doska/ui-kit"
import type { ReactNode } from "react"

export function Column({
  title,
  color,
  count,
  children,
}: {
  title: string
  color: string
  count: number
  children: ReactNode
}) {
  return (
    <section className="flex w-[85vw] max-w-80 shrink-0 flex-col sm:w-80">
      <div className="mb-3 flex items-center gap-2 px-1 text-sm text-muted-foreground uppercase">
        <span
          className="size-2.5 rounded-full"
          style={{ background: `oklch(0.72 0.14 ${columnHue(color)})` }}
        />
        <h2 className="font-heading font-bold">{title}</h2>
        <span className="ml-auto rounded-full bg-muted px-1.5 text-[11px] font-medium">
          {count}
        </span>
      </div>
      <div
        className={cn(
          "flex flex-1 flex-col rounded-3xl border bg-background p-4",
          "shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)] dark:shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]"
        )}
      >
        {children}
      </div>
    </section>
  )
}
