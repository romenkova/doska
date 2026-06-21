import { Button, cn } from "@doska/ui-kit"
import { Eye, EyeOff, Plus } from "lucide-react"

interface IProps {
  title: string
  showBody: boolean
  onToggleBody: () => void
  onAddCard: () => void
}

export function ColumnHead({
  onAddCard,
  onToggleBody,
  showBody,
  title,
}: IProps) {
  return (
    <div
      className={cn(
        "sticky top-0 z-10 flex items-center justify-between gap-2 py-3",
        "bg-background/80 backdrop-blur-xs",
        "text-muted-foreground uppercase"
      )}
    >
      {title}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon-lg"
          aria-pressed={showBody}
          aria-label={
            showBody ? `Hide body in ${title}` : `Show body in ${title}`
          }
          onClick={onToggleBody}
        >
          {showBody ? <EyeOff /> : <Eye />}
        </Button>
        <Button
          variant="secondary"
          size="icon-lg"
          onClick={onAddCard}
          aria-label={`Add card to ${title}`}
        >
          <Plus />
        </Button>
      </div>
    </div>
  )
}
