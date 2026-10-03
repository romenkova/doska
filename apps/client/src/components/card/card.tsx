import {
  memo,
  type DetailedHTMLProps,
  type HTMLAttributes,
  type ReactNode,
} from "react"
import { useLocation } from "wouter"
import type { CardPatch, Card as CardData, Column } from "@doska/core"
import { routes } from "@/lib/routes"
import { useIsRevealed } from "@/providers/card-reveal/card-reveal-context"
import { CardAttachments } from "./attachments/card-attachments"
import { CardAttachmentImage } from "./attachments/card-attachment-image"
import { CardContextMenu, CardMenu } from "./menu/card-menu"
import { CardMarkdown } from "./card-markdown"
import { CardView } from "./card-view"

interface IProps extends DetailedHTMLProps<
  HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
> {
  card: CardData
  column: Column
  showBody: boolean
  isDragging: boolean
  onPatch: (id: string, patch: CardPatch) => void
  lead?: ReactNode
  metaLead?: ReactNode
  imageCard?: boolean
}

export const Card = memo(function Card({
  card,
  column,
  showBody,
  isDragging,
  onPatch,
  lead,
  metaLead,
  imageCard,
  ...props
}: IProps) {
  const [, navigate] = useLocation()
  const id = card.id
  const isRevealed = useIsRevealed(id)

  const open = () => navigate(routes.card.to(id))

  return (
    <CardMarkdown cardId={id}>
      <CardView
        {...props}
        wrapCard={(inner) => (
          <CardContextMenu cardId={id} onEdit={open}>
            {inner}
          </CardContextMenu>
        )}
        card={card}
        column={column}
        showBody={showBody}
        isDragging={isDragging}
        isRevealed={isRevealed}
        lead={lead}
        metaLead={metaLead}
        imageCard={imageCard}
        action={<CardMenu cardId={id} onEdit={open} />}
        onChangeBody={(body) => onPatch(id, { body })}
        onChangeDeadline={(deadline) => onPatch(id, { deadline })}
        onChangePriority={(priority) => onPatch(id, { priority })}
        attachments={
          <CardAttachments className="pt-2" cardId={id} isReadonly />
        }
        renderAttachmentImage={(key, alt, className) => (
          <CardAttachmentImage
            cardId={id}
            attachmentKey={key}
            alt={alt}
            className={className}
          />
        )}
      />
    </CardMarkdown>
  )
})
