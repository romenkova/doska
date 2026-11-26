import { Button } from "@doska/ui-kit"
import { Archive } from "lucide-react"

export function ArchivedBanner({ onRestore }: { onRestore: () => void }) {
  return (
    <div
      role="status"
      className="mx-4 mt-2 flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 text-sm text-muted-foreground"
    >
      <Archive className="size-4 shrink-0" />
      <p className="flex-1">This card is archived</p>
      <Button size="sm" variant="secondary" onClick={onRestore}>
        Restore
      </Button>
    </div>
  )
}
