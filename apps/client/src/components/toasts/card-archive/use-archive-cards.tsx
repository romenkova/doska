import { Button, Toast } from "@doska/ui-kit"
import { toast } from "react-hot-toast"
import { useSetCardsArchived } from "@doska/core"
import { UNDO_TOASTER_ID } from "../card-delete/undo-toaster"
import { pluralize } from "@doska/utils"

export function useArchiveCards() {
  const { mutate } = useSetCardsArchived()

  const restore = (ids: string[]) => mutate({ ids, archived: false })

  const archive = (ids: string[], title?: string) => {
    mutate({ ids, archived: true })
    const label = title || pluralize(ids.length, "card")
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
              restore(ids)
            }}
          >
            Undo
          </Button>
        </Toast>
      ),
      { duration: 5000, toasterId: UNDO_TOASTER_ID }
    )
  }

  return { archive, restore }
}
