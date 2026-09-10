import { Markdown, useIsMobile } from "@doska/ui-kit"
import { useCallback, useState } from "react"
import { useLocation, useRoute } from "wouter"
import type { PublicBoard as Snapshot } from "@doska/contract"
import { routes } from "@/lib/routes"
import { CardMeta } from "../card/card-meta"
import { CardPaneLayout } from "../card-panel/card-pane-layout"
import { CardPanelHeader } from "../card-panel/card-panel-header"
import { CardPanelShell } from "../card-panel/card-panel-shell"
import { ColumnTag } from "../column/column-tag"
import { MarkdownEditor } from "../markdown"
import { PublicAttachments } from "./public-attachments"
import { PublicMarkdown } from "./public-markdown"

interface IProps {
  token: string
  snapshot: Snapshot
  /** Where to navigate when the panel closes (the board root). */
  closeHref: string
}

export function PublicCardPanel({ token, snapshot, closeHref }: IProps) {
  const [, navigate] = useLocation()
  const [, routeParams] = useRoute(routes.card.pattern)
  const routeId = routeParams?.id ?? null

  const [lastCard, setLastCard] = useState(routeId)
  if (routeId && routeId !== lastCard) setLastCard(routeId)

  const isMobile = useIsMobile()
  const cardId = routeId ?? (isMobile ? null : lastCard)
  const isOpen = routeId != null

  const close = useCallback(() => navigate(closeHref), [navigate, closeHref])

  const { cards, columns } = snapshot
  const card = cards.find((one) => one.id === cardId)
  const column = columns.find((one) => one.id === card?.columnId)

  return (
    <CardPanelShell
      isOpen={isOpen}
      onClose={close}
      onClosed={() => setLastCard(null)}
    >
      {card && (
        <PublicMarkdown
          key={card.id}
          cardId={card.id}
          token={token}
          cards={cards}
          columns={columns}
        >
          <div className="flex min-h-0 flex-1 flex-col">
            <CardPaneLayout
              header={
                <CardPanelHeader
                  isPreview
                  onClose={close}
                  meta={
                    <>
                      <CardMeta card={card} column={column} />
                      {column && (
                        <ColumnTag title={column.title} color={column.color} />
                      )}
                    </>
                  }
                />
              }
              attachments={
                <PublicAttachments
                  className="py-2"
                  attachments={card.attachments ?? []}
                  token={token}
                />
              }
              title={
                <MarkdownEditor
                  renderPreview={Markdown}
                  isPreview
                  value={card.title}
                  className="py-1.5 text-xl! font-semibold"
                />
              }
              body={
                <MarkdownEditor
                  renderPreview={Markdown}
                  isPreview
                  value={card.body}
                  containerClassName="flex-1"
                />
              }
            />
          </div>
        </PublicMarkdown>
      )}
    </CardPanelShell>
  )
}
