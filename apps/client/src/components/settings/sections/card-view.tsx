import { Button, useIsMobile } from "@doska/ui-kit"
import { useState } from "react"
import { getCardView, setCardView, type CardView } from "@/lib/card-view"
import { SettingsSection } from "../section"

const OPTIONS: { value: CardView; label: string }[] = [
  { value: "panel", label: "Panel" },
  { value: "modal", label: "Modal" },
]

export function CardViewSection() {
  const [view, setView] = useState(getCardView)
  const isMobile = useIsMobile()
  if (isMobile) return null

  return (
    <SettingsSection title="Cards">
      <div className="flex items-center justify-between gap-3">
        <span className="flex flex-col gap-1">
          <span className="text-sm">Open cards in</span>
          <span className="text-xs text-muted-foreground">
            A side panel, or a modal in the middle.
          </span>
        </span>
        <span className="flex items-center gap-1">
          {OPTIONS.map((option) => (
            <Button
              key={option.value}
              type="button"
              variant={view === option.value ? "secondary" : "ghost"}
              size="sm"
              aria-pressed={view === option.value}
              onClick={() => {
                setCardView(option.value)
                setView(option.value)
              }}
            >
              {option.label}
            </Button>
          ))}
        </span>
      </div>
    </SettingsSection>
  )
}
