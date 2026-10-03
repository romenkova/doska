import { useState } from "react"
import { useLocation } from "wouter"
import { publicAttachmentUrl, groupCardsByColumn, sortCards } from "@doska/core"
import type { PublicBoard as Snapshot } from "@doska/contract"
import { AttachmentImage } from "../card/attachments/attachment-image"
import { CardView } from "../card/card-view"
import { ColumnView } from "../column/column-view"
import { BoardView } from "../deck/board-view"
import { routes } from "@/lib/routes"
import { PublicAttachments } from "./public-attachments"
import { PublicMarkdown } from "./public-markdown"

interface IProps {
  token: string
  snapshot: Snapshot
}

export function PublicBoard({ token, snapshot }: IProps) {
  const [, navigate] = useLocation()
  const { dashboard, columns, cards } = snapshot
  // Collapsing is a way of reading the board, not of changing it, so a visitor
  // gets the toggle — it starts where the owner left it and goes nowhere.
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const grouped = groupCardsByColumn({ columns, cards })
  const sort = dashboard.sort ?? []

  return (
    <BoardView>
      {grouped.map(({ column, cards: columnCards }) => {
        const ordered = sortCards(columnCards, sort)
        const showBody = expanded[column.id] ?? !column.collapsed
        return (
          <ColumnView
            key={column.id}
            title={column.title}
            color={column.color}
            done={column.done}
            showBody={showBody}
            onToggleBody={() =>
              setExpanded((state) => ({ ...state, [column.id]: !showBody }))
            }
          >
            {ordered.map((card) => (
              <PublicMarkdown
                key={card.id}
                cardId={card.id}
                token={token}
                cards={cards}
                columns={columns}
              >
                <CardView
                  card={card}
                  column={column}
                  showBody={showBody}
                  onClick={() => navigate(routes.card.to(card.id))}
                  attachments={
                    <PublicAttachments
                      className="pt-2"
                      attachments={card.attachments ?? []}
                      token={token}
                    />
                  }
                  renderAttachmentImage={(key, alt, className) => (
                    <AttachmentImage
                      src={publicAttachmentUrl(token, key)}
                      alt={alt}
                      source="token"
                      className={className}
                    />
                  )}
                />
              </PublicMarkdown>
            ))}
          </ColumnView>
        )
      })}
    </BoardView>
  )
}
