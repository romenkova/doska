import { Input } from "@doska/ui-kit"
import { useState } from "react"
import { useLocation } from "wouter"
import { byPosition, useBoard } from "@doska/core"
import { useArchiveCards } from "@/components/toasts/card-archive/use-archive-cards"
import { routes } from "@/lib/routes"
import { CardAttachmentImage } from "../card/attachments/card-attachment-image"
import { CardMarkdown } from "../card/card-markdown"
import { CardView } from "../card/card-view"
import { ColumnSwatch } from "../column/column-swatch"
import { ArchivedCardActions } from "./archived-card-actions"
import { CardPanelHeader } from "./card-panel-header"

interface IProps {
  deckId: string
  onClose: () => void
  onReveal: (cardId: string) => void
}

export function ArchivePane({ deckId, onClose, onReveal }: IProps) {
  const [query, setQuery] = useState("")
  const [, navigate] = useLocation()
  const { data: board } = useBoard(deckId)
  const { restore } = useArchiveCards()

  const columns = [...(board?.columns ?? [])].sort(byPosition)
  const needle = query.trim().toLowerCase()

  const archived = (board?.cards ?? []).filter((card) => card.archived)
  const entries = columns.flatMap((column) =>
    archived
      .filter(
        (card) =>
          card.columnId === column.id &&
          card.title.toLowerCase().includes(needle)
      )
      .sort(byPosition)
      .map((card) => ({ card, column }))
  )

  return (
    <>
      <CardPanelHeader
        onClose={onClose}
        isPreview={false}
        meta={<span className="font-medium">Archived cards</span>}
      />
      <div className="px-4 pt-3 pb-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search archived cards"
          aria-label="Search archived cards"
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-1 pb-4">
        {entries.length === 0 && (
          <p className="py-2 text-muted-foreground">
            {archived.length === 0 ? "Nothing archived." : "Nothing matches."}
          </p>
        )}
        <ul className="space-y-3">
          {entries.map(({ card, column }) => (
            <li key={card.id}>
              <CardMarkdown cardId={card.id}>
                <CardView
                  card={card}
                  column={column}
                  showBody={false}
                  imageCard={false}
                  isArchived
                  className="mb-0 max-w-none"
                  onClick={() => navigate(routes.card.to(card.id))}
                  action={
                    <ArchivedCardActions
                      cardId={card.id}
                      title={card.title}
                      onRestore={() => {
                        restore([card.id])
                        onReveal(card.id)
                      }}
                    />
                  }
                  metaLead={
                    <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
                      <ColumnSwatch color={column.color} />
                      <span className="truncate">{column.title}</span>
                    </span>
                  }
                  renderAttachmentImage={(key, alt, className) => (
                    <CardAttachmentImage
                      cardId={card.id}
                      attachmentKey={key}
                      alt={alt}
                      className={className}
                    />
                  )}
                />
              </CardMarkdown>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}
