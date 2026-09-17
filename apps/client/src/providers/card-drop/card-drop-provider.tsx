import { useMemo, useState, type ReactNode } from "react"
import { CardDropProvider, type CardDropTarget } from "./card-drop-context"

export function CardDropStateProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<CardDropTarget | null>(null)

  const value = useMemo(() => ({ target, setTarget }), [target])

  return <CardDropProvider value={value}>{children}</CardDropProvider>
}
