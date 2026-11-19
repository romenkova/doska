import { MenuItem } from "@doska/ui-kit"
import { Archive, ArchiveRestore } from "lucide-react"
import { restoreCards, useIsArchived } from "@/lib/archive-prototype"
import { archiveWithUndo } from "@/components/toasts/card-archive/show-archive-toast"

export function ArchiveItem({
  cardId,
  title,
  onRestore,
}: {
  cardId: string
  title: string
  onRestore?: () => void
}) {
  const isArchived = useIsArchived(cardId)

  if (isArchived)
    return (
      <MenuItem
        onClick={() => {
          restoreCards([cardId])
          onRestore?.()
        }}
      >
        <ArchiveRestore />
        Restore
      </MenuItem>
    )

  return (
    <MenuItem onClick={() => archiveWithUndo([cardId], title.trim() || "Card")}>
      <Archive />
      Archive
    </MenuItem>
  )
}
