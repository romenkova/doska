import type { ReactNode } from "react"

export function MdList({
  ordered,
  start,
  children,
}: {
  ordered?: boolean
  /** First ordinal of an ordered list; omitted or 1 renders no `start`. */
  start?: number
  children: ReactNode
}) {
  const className = "my-3 pl-5 marker:text-muted-foreground"
  if (ordered)
    return (
      <ol
        className={`${className} list-decimal`}
        start={start === 1 ? undefined : start}
      >
        {children}
      </ol>
    )
  return <ul className={`${className} list-disc`}>{children}</ul>
}
