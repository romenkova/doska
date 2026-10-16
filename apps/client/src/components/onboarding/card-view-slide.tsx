import { useState } from "react"
import { cn, Markdown } from "@doska/ui-kit"
import { getCardView, setCardView, type CardView } from "@/lib/card-view"
import cardView from "./slides/card-view.md?raw"

const OPTIONS: { value: CardView; label: string; description: string }[] = [
  {
    value: "panel",
    label: "Panel",
    description: "Next to the board, so it stays in view",
  },
  {
    value: "modal",
    label: "Modal",
    description: "In the middle, with room to write",
  },
]

interface IProps {
  onDone: () => void
}

export function CardViewSlide({ onDone }: IProps) {
  const [view, setView] = useState(getCardView)

  return (
    <>
      <Markdown>{cardView}</Markdown>
      <div className="mt-8 flex flex-col gap-2">
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={view === option.value}
            onClick={() => {
              setCardView(option.value)
              setView(option.value)
              onDone()
            }}
            className={cn(
              "flex flex-col gap-0.5 rounded-lg border px-4 py-3 text-left text-sm transition-colors hover:bg-accent",
              view === option.value && "border-foreground bg-accent"
            )}
          >
            <span className="font-medium">{option.label}</span>
            <span className="text-muted-foreground">{option.description}</span>
          </button>
        ))}
      </div>
    </>
  )
}
