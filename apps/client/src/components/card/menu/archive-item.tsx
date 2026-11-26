import { MenuItem } from "@doska/ui-kit"
import { Archive, ArchiveRestore } from "lucide-react"
import { useArchiveCards } from "@/components/toasts/card-archive/use-archive-cards"

export function ArchiveItem({
  cardId,
  title,
  archived,
  onRestore,
}: {
  cardId: string
  title: string
  archived: boolean
  onRestore?: () => void
}) {
  const { archive, restore } = useArchiveCards()

  if (archived)
    return (
      <MenuItem
        onClick={() => {
          restore([cardId])
          onRestore?.()
        }}
      >
        <ArchiveRestore />
        Restore
      </MenuItem>
    )

  return (
    <MenuItem onClick={() => archive([cardId], title.trim() || "Card")}>
      <Archive />
      Archive
    </MenuItem>
  )
}
