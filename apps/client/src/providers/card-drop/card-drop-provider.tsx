import { useMemo, useState, type ReactNode } from "react"
import { CardDropProvider, type CardDropTarget } from "./card-drop-context"

export function CardDropStateProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<CardDropTarget | null>(null)
  const [droppedOn, setDroppedOn] = useState<string | null>(null)

  const value = useMemo(
    () => ({ target, setTarget, droppedOn, setDroppedOn }),
    [target, droppedOn]
  )

  return <CardDropProvider value={value}>{children}</CardDropProvider>
}
