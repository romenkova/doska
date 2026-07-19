import {
  MarkdownTextarea,
  DEFAULT_SLASH_COMMANDS,
  toAttachmentSrc,
  cut,
} from "@doska/markdown"
import { useMemo } from "react"
import { useCard } from "@/lib/data/queries"
import { AttachmentImage } from "../card/attachments/attachment-image"
import { imageSlashCommands } from "../card/attachments/image-slash-commands"
import { isRenderableImage } from "../card/attachments/renderable-image"
import { useUploads } from "../card/attachments/context/attachment-upload-context"

const PREVIEW_MARKERS = [cut]

interface IProps {
  cardId: string
  body: string
  isPreview: boolean
  onChangeBody: (value: string) => void
}

/** Card body textarea wired to attachments. Must render inside `AttachmentUploadProvider`. */
export function CardBodyEditor({
  cardId,
  body,
  isPreview,
  onChangeBody,
}: IProps) {
  const { data: card } = useCard(cardId)
  const { addFiles } = useUploads()
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
    <MarkdownTextarea
      value={body}
      onChange={(e) => onChangeBody(e.target.value)}
      onChangeValue={onChangeBody}
      onToggleTask={onChangeBody}
      slashMenu
      slashCommands={slashCommands}
      renderImage={(key, alt) => (
        <AttachmentImage cardId={cardId} attachmentKey={key} alt={alt} />
      )}
      onPasteFiles={handlePasteFiles}
      placeholder="Notes"
      isPreview={isPreview}
      markers={PREVIEW_MARKERS}
      className="min-h-[50vh] shrink-0 resize-none"
      containerClassName="flex-1"
    />
  )
}
