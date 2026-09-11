import { TitleEditor } from "@doska/ui-kit"
import { useState } from "react"
import { CardPaneLayout } from "./card-pane-layout"
import { CardPanelHeader } from "./card-panel-header"
import { CardPanelMenu } from "./card-panel-menu"
import { CardBodyEditor } from "./card-body-editor"
import { CardMetaLive } from "../card/card-meta-live"
import { CardAttachments } from "../card/attachments/card-attachments"
import { AddAttachmentButton } from "../card/attachments/add-attachment-button"
import { AttachmentDropZone } from "../card/attachments/attachment-drop-zone"
import { AttachmentUploadProvider } from "@/providers/attachment-upload/attachment-upload-provider"
import { isIOS } from "@/lib/platform"

interface IProps {
  cardId: string
  title: string
  body: string
  isPreview: boolean
  onChangeTitle: (value: string) => void
  onChangeBody: (value: string) => void
  onTogglePreview?: () => void
  withHeader?: boolean
  onEdit: () => void
  onClose: () => void
  onDelete?: () => void
  onReveal?: () => void
  onPopOut?: () => void
  inWindow?: boolean
}

/** Ignore the click that ends a text selection — treat it as selecting, not editing. */
function hasTextSelection(): boolean {
  const selection = window.getSelection()
  return selection !== null && !selection.isCollapsed
}

/** A click on an inline body image should view it, not drop into edit mode. */
function isImageClick(target: EventTarget): boolean {
  return target instanceof Element && target.closest("img") !== null
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
  withHeader = true,
  onEdit,
  onClose,
  onDelete,
  onReveal,
  onPopOut,
  inWindow,
}: IProps) {
  const [overlay, setOverlay] = useState<HTMLDivElement | null>(null)

  const [focus] = useState(() => {
    if (!title.trim() && !body.trim()) return "title"
    // no auto focus on ios because of the scroll-jump bug
    return isIOS() ? "none" : "body"
  })

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AttachmentUploadProvider cardId={cardId}>
        <AttachmentDropZone className="flex min-h-0 flex-1 flex-col">
          <div
            ref={setOverlay}
            className="relative flex min-h-0 flex-1 flex-col"
          >
            <CardPaneLayout
              header={
                withHeader && (
                  <CardPanelHeader
                    isPreview={isPreview}
                    onClose={onClose}
                    onTogglePreivew={onTogglePreview}
                    inWindow={inWindow}
                    actions={<AddAttachmentButton />}
                    menu={
                      onDelete &&
                      onReveal && (
                        <CardPanelMenu
                          cardId={cardId}
                          isPreview={isPreview}
                          onEdit={onEdit}
                          onReveal={onReveal}
                          onDelete={onDelete}
                          onPopOut={onPopOut}
                        />
                      )
                    }
                    meta={<CardMetaLive cardId={cardId} body={body} />}
                  />
                )
              }
              attachments={
                <CardAttachments
                  className="py-2"
                  cardId={cardId}
                  isReadonly={isPreview}
                />
              }
              onClickBody={
                isPreview
                  ? (e) => {
                      if (isImageClick(e.target)) return
                      if (!hasTextSelection()) onEdit()
                    }
                  : undefined
              }
              title={
                <TitleEditor
                  value={title}
                  onChangeValue={onChangeTitle}
                  isPreview={isPreview}
                  autoFocus={focus === "title"}
                />
              }
              body={
                <CardBodyEditor
                  cardId={cardId}
                  body={body}
                  autoFocus={focus === "body"}
                  isPreview={isPreview}
                  onChangeBody={onChangeBody}
                  overlayContainer={overlay}
                />
              }
            />
          </div>
        </AttachmentDropZone>
      </AttachmentUploadProvider>
    </div>
  )
}
