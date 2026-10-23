import { MenuItem } from "@doska/ui-kit"
import { SquareText } from "lucide-react"
import { useCard, useSetCardTemplate } from "@doska/core"

export function TemplateItem({ cardId }: { cardId: string }) {
  const { data: card } = useCard(cardId)
  const { mutate: setTemplate } = useSetCardTemplate(cardId)
  const template = card?.template ?? false

  return (
    <MenuItem onClick={() => setTemplate(!template)}>
      <SquareText />
      {template ? "Remove from templates" : "Add to templates"}
    </MenuItem>
  )
}
