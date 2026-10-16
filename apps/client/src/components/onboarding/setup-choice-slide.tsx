import { cn, Markdown } from "@doska/ui-kit"
import setup from "./slides/setup.md?raw"

export type Setup = "selfhost" | "local"

const OPTIONS: { value: Setup; label: string; description: string }[] = [
  {
    value: "selfhost",
    label: "Yes",
    description: "Sync boards through my own server",
  },
  {
    value: "local",
    label: "No",
    description: "Keep everything on this device",
  },
]

interface IProps {
  value: Setup | null
  onChange: (value: Setup) => void
}

export function SetupChoiceSlide({ value, onChange }: IProps) {
  return (
    <>
      <Markdown>{setup}</Markdown>
      <div className="mt-8 flex flex-col gap-2">
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex flex-col gap-0.5 rounded-lg border px-4 py-3 text-left text-sm transition-colors hover:bg-accent",
              value === option.value && "border-foreground bg-accent"
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
