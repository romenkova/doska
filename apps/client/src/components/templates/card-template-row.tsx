import { Button, Card as CardBase } from "@doska/ui-kit"
import { StickyNote, X } from "lucide-react"
import { useLocation } from "wouter"
import { useSetCardTemplate, type TemplateCard } from "@doska/core"
import { routes } from "@/lib/routes"

export function CardTemplateRow({ entry }: { entry: TemplateCard }) {
  const [, navigate] = useLocation()
  const { card, boardId, boardTitle } = entry
  const { mutate: setTemplate } = useSetCardTemplate(card.id)

  return (
    <li>
      <CardBase className="flex-row items-center gap-3 rounded-xl px-3">
        <StickyNote className="size-4 shrink-0 text-muted-foreground" />
        <button
          type="button"
          onClick={() =>
            navigate(`~${routes.deck.to(boardId)}${routes.card.to(card.id)}`)
          }
          className="flex min-w-0 flex-1 flex-col text-left"
        >
          <span className="truncate text-base font-medium hover:underline">
            {card.title || "Untitled card"}
          </span>
          <span className="truncate text-sm text-muted-foreground">
            {boardTitle || "Untitled board"}
          </span>
        </button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Remove from templates"
          className="text-muted-foreground"
          onClick={() => setTemplate(false)}
        >
          <X />
        </Button>
      </CardBase>
    </li>
  )
}
