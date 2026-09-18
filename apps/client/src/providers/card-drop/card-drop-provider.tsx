import { useState, type ReactNode } from "react"
import { CardDropCtx, type CardDropTarget } from "./card-drop-context"

export function CardDropProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<CardDropTarget | null>(null)

  return (
    <CardDropCtx.Provider value={{ target, setTarget }}>
      {children}
    </CardDropCtx.Provider>
  )
}
