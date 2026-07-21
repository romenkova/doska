import type { ReactNode } from "react"

/** A `[label]` pill. The color index picks a hue from the markdown tag palette. */
export function Tag({
  color,
  children,
}: {
  color: number
  children: ReactNode
}) {
  return (
    <span className="tag" data-tag-color={color}>
      {children}
    </span>
  )
}
