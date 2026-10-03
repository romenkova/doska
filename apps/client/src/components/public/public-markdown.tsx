import { useMemo, type ReactNode } from "react"
import { MarkdownRenderersProvider } from "@doska/markdown"
import { publicAttachmentUrl, type Card, type Column } from "@doska/core"
import { AttachmentImage } from "../card/attachments/attachment-image"
import { PublicCardRefLink } from "./public-card-ref-link"

interface IProps {
  cardId: string
  token: string
  cards: Card[]
  columns: Column[]
  children: ReactNode
}

/**
 * Resolves the parts of a card body that need board data, for a visitor who has
 * only the snapshot and the token. `CardMarkdown`'s counterpart.
 */
export function PublicMarkdown({
  cardId,
  token,
  cards,
  columns,
  children,
}: IProps) {
  const card = cards.find((one) => one.id === cardId)
  const attachments = card?.attachments

  const renderers = useMemo(
    () => ({
      renderImage: (key: string, alt: string) => (
        <AttachmentImage
          src={publicAttachmentUrl(token, key)}
          alt={alt}
          source="token"
          attachment={attachments?.find((a) => a.key === key)}
        />
      ),
      renderWikilink: (target: string, alias?: string) => (
        <PublicCardRefLink
          displayId={target}
          alias={alias}
          cards={cards}
          columns={columns}
        />
      ),
    }),
    [token, attachments, cards, columns]
  )

  return (
    <MarkdownRenderersProvider value={renderers}>
      {children}
    </MarkdownRenderersProvider>
  )
}
