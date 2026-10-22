import { Button } from "@doska/ui-kit"
import { CircleHelp } from "lucide-react"

export function TemplatesHelpButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="How templates work"
      className="ml-auto text-muted-foreground"
      onClick={onClick}
    >
      <CircleHelp />
    </Button>
  )
}
