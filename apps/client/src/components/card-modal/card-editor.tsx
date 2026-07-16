import { CardContent, ModalContent, cn } from "@doska/ui-kit"
import { MarkdownTextarea, cut } from "@doska/markdown"
import { CardContentLayout } from "./card-content-layout"
import { CardModalHeader } from "./card-modal-header"
import { CardMeta } from "../card/card-meta"
import { CardAttachments } from "../card/attachments/card-attachments"
import { AttachmentDropZone } from "../card/attachments/attachment-drop-zone"
import { AttachmentUploadProvider } from "../card/attachments/context/attachment-upload-provider"

const PREVIEW_MARKERS = [cut]

interface IProps {
  cardId: string
  title: string
  body: string
  isPreview: boolean
  onChangeTitle: (value: string) => void
  onChangeBody: (value: string) => void
  onTogglePreview: () => void
  /** Fired by double-clicking the read-only preview. */
  onEdit: () => void
  onClose: () => void
}

/** Presentational card editor: renders the draft and reports edits upward. */
export function CardEditor({
  cardId,
  title,
  body,
  isPreview,
  onChangeTitle,
  onChangeBody,
  onTogglePreview,
  onEdit,
  onClose,
}: IProps) {
  return (
    <ModalContent>
      <AttachmentUploadProvider cardId={cardId}>
        <CardModalHeader
          isPreview={isPreview}
          onClose={onClose}
          onSave={onClose}
          onTogglePreivew={onTogglePreview}
        />
        <AttachmentDropZone className="flex min-h-0 flex-1 flex-col">
          <CardContentLayout onDoubleClick={isPreview ? onEdit : undefined}>
            <CardContent className="py-2">
              <CardMeta cardId={cardId} body={body} />
            </CardContent>
            <CardAttachments
              className="py-2"
              cardId={cardId}
              isReadonly={isPreview}
            />
            <CardContent className="flex min-h-0 flex-1 flex-col px-4 pt-2">
              <MarkdownTextarea
                autoFocus
                value={title}
                onChange={(e) => onChangeTitle(e.target.value)}
                placeholder="Title"
                isPreview={isPreview}
                className={cn(
                  "py-1.5 text-xl! font-semibold",
                  !isPreview && "font-mono"
                )}
              />
              <MarkdownTextarea
                value={body}
                onChange={(e) => onChangeBody(e.target.value)}
                onChangeValue={onChangeBody}
                onToggleTask={onChangeBody}
                slashMenu
                placeholder="Notes"
                isPreview={isPreview}
                markers={PREVIEW_MARKERS}
                className="min-h-full shrink-0 resize-none"
                containerClassName="flex-1"
              />
            </CardContent>
          </CardContentLayout>
        </AttachmentDropZone>
      </AttachmentUploadProvider>
    </ModalContent>
  )
}
