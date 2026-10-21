import {
  Button,
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from "@doska/ui-kit"
import { SquareText } from "lucide-react"
import { useLocation } from "wouter"
import { useTemplateCards, type Card } from "@doska/core"
import { routes } from "@/lib/routes"

interface IProps {
  onSelect: (template: Card) => void
}

export function CardTemplatePicker({ onSelect }: IProps) {
  const [, navigate] = useLocation()
  const { data: templates = [] } = useTemplateCards()
  if (templates.length === 0) return null

  return (
    <Menu>
      <MenuTrigger
        render={<Button variant="muted" aria-label="Add card from template" />}
      >
        <SquareText />
      </MenuTrigger>
      <MenuContent align="end">
        {templates.map(({ card }) => (
          <MenuItem key={card.id} onClick={() => onSelect(card)}>
            {card.title || "Untitled card"}
          </MenuItem>
        ))}
        <MenuSeparator />
        <MenuItem onClick={() => navigate(`~${routes.templates()}`)}>
          Edit templates
        </MenuItem>
      </MenuContent>
    </Menu>
  )
}
