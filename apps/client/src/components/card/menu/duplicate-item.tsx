import { MenuItem } from "@doska/ui-kit"
import { Copy } from "lucide-react"
import { useDuplicateCard } from "@doska/core"

export function DuplicateItem({ cardId }: { cardId: string }) {
  const { mutate: duplicateCard } = useDuplicateCard()

  return (
    <MenuItem onClick={() => duplicateCard(cardId)}>
      <Copy />
      Duplicate
    </MenuItem>
  )
}
