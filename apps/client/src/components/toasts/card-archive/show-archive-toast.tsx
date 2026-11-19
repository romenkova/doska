import { Button, Toast } from "@doska/ui-kit"
import { toast } from "react-hot-toast"
import { archiveCards, restoreCards } from "@/lib/archive-prototype"
import { UNDO_TOASTER_ID } from "../card-delete/undo-toaster"

export function archiveWithUndo(ids: string[], title?: string) {
  archiveCards(ids)
  const label = title || (ids.length === 1 ? "1 card" : `${ids.length} cards`)
  toast.custom(
    (t) => (
      <Toast visible={t.visible} className="gap-3">
        <span className="min-w-0 flex-1 truncate">{label} archived</span>
        <Button
          variant="secondary"
          size="sm"
          className="shrink-0"
          onClick={() => {
            toast.dismiss(t.id)
            restoreCards(ids)
          }}
        >
          Undo
        </Button>
      </Toast>
    ),
    { duration: 5000, toasterId: UNDO_TOASTER_ID }
  )
}
