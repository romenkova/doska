import { useMemo, type ReactNode } from "react"
import { MarkdownRenderersProvider } from "@doska/markdown"
import { CardAttachmentImage } from "./attachments/card-attachment-image"
import { CardRefLink } from "./refs/card-ref-link"
import { useDeck } from "@/providers/deck/deck-context"

/**
 * Resolves the parts of a card body that need app data — attachment images and
 * `[[12]]` card refs. Wrap anything rendering a body; image refs are scoped to
 * the card that owns the attachment, so the card is as wide as this can go.
 */
export function CardMarkdown({
  cardId,
  children,
}: {
  cardId: string
  children: ReactNode
}) {
  const { toggleTagFilter } = useDeck()
  const renderers = useMemo(
    () => ({
      renderImage: (key: string, alt: string) => (
        <CardAttachmentImage cardId={cardId} attachmentKey={key} alt={alt} />
      ),
      renderWikilink: (target: string, alias?: string) => (
        <CardRefLink displayId={target} alias={alias} />
      ),
      onTagClick: toggleTagFilter,
    }),
    [cardId, toggleTagFilter]
  )

  return (
    <MarkdownRenderersProvider value={renderers}>
      {children}
    </MarkdownRenderersProvider>
  )
}
