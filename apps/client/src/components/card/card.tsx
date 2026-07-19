import {
  Card as CardBase,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@doska/ui-kit"
import { cn } from "@doska/ui-kit"
import { fallbackCard } from "@/lib/seed"
import { useLocation } from "wouter"
import { routes } from "@/lib/routes"
import { CardMeta } from "./card-meta"
import { CardContextMenu, CardMenu } from "./menu/card-menu"
import { useCard } from "@/lib/data/queries"
import { useUpdateCard } from "@/lib/data/mutations"
import { MarkdownCardPreview } from "@doska/markdown"
import type { DetailedHTMLProps, HTMLAttributes } from "react"
import { CardAttachments } from "./attachments/card-attachments"
import { CardMarkdown } from "./card-markdown"

interface IProps extends DetailedHTMLProps<
  HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
> {
  id: string
  index: number
  showBody: boolean
  isDragging: boolean
}

export function Card({ id, showBody, isDragging, ...props }: IProps) {
  const [, navigate] = useLocation()
  const { data: card = fallbackCard } = useCard(id)
  const { mutate: updateCard } = useUpdateCard(id)
  const { title, body } = card
  const attachments = card.attachments ?? []

  return (
    <div
      {...props}
      className={cn(
        "group relative mb-3 w-full max-w-sm cursor-pointer rounded-lg",
        "touch-manipulation select-none [-webkit-tap-highlight-color:transparent] [-webkit-touch-callout:none]"
      )}
    >
      <CardContextMenu cardId={id} onEdit={() => navigate(routes.card.to(id))}>
        <CardBase className={cn(isDragging && "shadow-shade/5 shadow-xl")}>
          <CardHeader>
            <CardTitle>{title || "Untitled card"}</CardTitle>
            <CardAction className="flex items-center gap-1">
              <CardMenu
                cardId={id}
                onEdit={() => navigate(routes.card.to(id))}
              />
            </CardAction>
          </CardHeader>
          <CardContent className={cn(!showBody && "-mb-2")}>
            <CardMeta cardId={id} className="mt-2" />
          </CardContent>

          {body.trim() && (
            <div
              className={cn(
                "grid transition-[grid-template-rows] duration-200 ease-out",
                showBody ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              )}
            >
              <div className="overflow-hidden">
                <CardContent className="space-y-3 pt-2">
                  <CardMarkdown cardId={id}>
                    <MarkdownCardPreview
                      body={body}
                      onChangeBody={(body) => updateCard({ body })}
                    />
                  </CardMarkdown>
                </CardContent>
              </div>
            </div>
          )}
          {attachments.length > 0 && showBody && (
            <CardAttachments className="pt-2" cardId={id} isReadonly />
          )}
        </CardBase>
      </CardContextMenu>
    </div>
  )
}
