import { CardContent, cn } from "@doska/ui-kit"
import { MarkdownTextarea } from "@doska/markdown"
import { CardContentLayout } from "./card-content-layout"
import { CardPanelHeader } from "./card-panel-header"
import { CardBodyEditor } from "./card-body-editor"
import { CardMeta } from "../card/card-meta"
import { CardAttachments } from "../card/attachments/card-attachments"
import { AttachmentDropZone } from "../card/attachments/attachment-drop-zone"
import { AttachmentUploadProvider } from "../card/attachments/context/attachment-upload-provider"

interface IProps {
  cardId: string
  title: string
  body: string
  isPreview: boolean
  onChangeTitle: (value: string) => void
  onChangeBody: (value: string) => void
  onTogglePreview: () => void
  /** Fired by clicking the read-only preview. */
  onEdit: () => void
  onClose: () => void
}

/** Ignore the click that ends a text selection — treat it as selecting, not editing. */
function hasTextSelection(): boolean {
  const selection = window.getSelection()
  return selection !== null && !selection.isCollapsed
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
    <div className="flex min-h-0 flex-1 flex-col">
      <AttachmentUploadProvider cardId={cardId}>
        <CardPanelHeader
          isPreview={isPreview}
          onClose={onClose}
          onSave={onClose}
          onTogglePreivew={onTogglePreview}
        />
        <AttachmentDropZone className="flex min-h-0 flex-1 flex-col">
          <CardContentLayout
            onClick={
              isPreview
                ? () => {
                    if (!hasTextSelection()) onEdit()
                  }
                : undefined
            }
          >
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
              <CardBodyEditor
                cardId={cardId}
                body={body}
                isPreview={isPreview}
                onChangeBody={onChangeBody}
              />
            </CardContent>
          </CardContentLayout>
        </AttachmentDropZone>
      </AttachmentUploadProvider>
    </div>
  )
}
