import { DEFAULT_SLASH_COMMANDS, toAttachmentSrc, cut } from "@doska/markdown"
import { useMemo } from "react"
import { useCardRefOptions } from "@doska/core/card-refs"
import { useCard } from "@doska/core/queries"
import { useDeck } from "@/providers/deck/deck-context"
import { imageSlashCommands } from "../card/attachments/image-slash-commands"
import { isRenderableImage } from "../card/attachments/renderable-image"
import { useUploads } from "@/providers/attachment-upload/attachment-upload-context"
import { CardMarkdown } from "../card/card-markdown"
import { cn, Markdown } from "@doska/ui-kit"
import { MarkdownEditor } from "../markdown"

const PREVIEW_MARKERS = [cut]

interface IProps {
  cardId: string
  body: string
  autoFocus?: boolean
  isPreview: boolean
  onChangeBody: (value: string) => void
  /** Non-scrolling pane element the mobile slash button anchors to. */
  overlayContainer?: HTMLElement | null
}

/** Card body textarea wired to attachments. Must render inside `AttachmentUploadProvider`. */
export function CardBodyEditor({
  cardId,
  body,
  autoFocus,
  isPreview,
  onChangeBody,
  overlayContainer,
}: IProps) {
  const { id: deckId } = useDeck()
  const { data: card } = useCard(cardId)
  const { addFiles } = useUploads()
  const cardRefs = useCardRefOptions(deckId, cardId)
  const attachments = card?.attachments

  const slashCommands = useMemo(
    () => [...DEFAULT_SLASH_COMMANDS, ...imageSlashCommands(attachments ?? [])],
    [attachments]
  )

  async function handlePasteFiles(files: File[]): Promise<string | null> {
    const added = await addFiles(files)
    const refs = added
      .filter((a) => isRenderableImage(a.mime))
      .map((a) => `![${a.name}](${toAttachmentSrc(a.key)})`)
    return refs.length ? refs.join("\n") : null
  }

  return (
    <CardMarkdown cardId={cardId}>
      <MarkdownEditor
        renderPreview={Markdown}
        value={body}
        autoFocus={autoFocus}
        onChangeValue={onChangeBody}
        onToggleTask={onChangeBody}
        slashMenu
        markdown
        slashCommands={slashCommands}
        overlayContainer={overlayContainer}
        wikilinks={cardRefs}
        onPasteFiles={handlePasteFiles}
        placeholder="Notes"
        isPreview={isPreview}
        markers={PREVIEW_MARKERS}
        className={cn(
          "min-h-[50vh] shrink-0 text-foreground/90",
          isPreview && "text-[1.1rem]"
        )}
        containerClassName="flex-1"
      />
    </CardMarkdown>
  )
}
