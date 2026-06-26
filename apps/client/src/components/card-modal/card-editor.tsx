import { ModalContent, cn } from "@doska/ui-kit"
import { MarkdownTextarea, cut } from "@doska/markdown"
import { CardContentLayout } from "./card-content-layout"
import { CardModalHeader } from "./card-modal-header"
import { CardDeadline } from "../card/deadline/card-deadline"

const PREVIEW_MARKERS = [cut]

interface IProps {
  title: string
  body: string
  deadline: string | null
  isPreview: boolean
  isLocked: boolean
  onChangeTitle: (value: string) => void
  onChangeBody: (value: string) => void
  onChangeDeadline: (value: string | null) => void
  onTogglePreview: () => void
  onToggleLock: () => void
  onClose: () => void
}

/** Presentational card editor: renders the draft and reports edits upward. */
export function CardEditor({
  title,
  body,
  deadline,
  isPreview,
  isLocked,
  onChangeTitle,
  onChangeBody,
  onChangeDeadline,
  onTogglePreview,
  onToggleLock,
  onClose,
}: IProps) {
  return (
    <ModalContent className="md:h-[85vh]">
      <CardModalHeader
        isPreview={isPreview}
        isLocked={isLocked}
        onClose={onClose}
        onSave={onClose}
        onToggleLock={onToggleLock}
        onTogglePreivew={onTogglePreview}
      />
      <CardContentLayout>
        <MarkdownTextarea
          autoFocus
          value={title}
          onChange={(e) => onChangeTitle(e.target.value)}
          placeholder="Title"
          isPreview={isPreview}
          className={cn(
            "py-1.5 text-xl! font-semibold",
            !isPreview && "border-b-2 border-dashed font-mono"
          )}
        />
        <CardDeadline
          variant={isPreview ? "chip" : "field"}
          value={deadline}
          onChange={onChangeDeadline}
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
          className="flex-1 resize-none"
          containerClassName="flex-1 mt-4"
        />
      </CardContentLayout>
    </ModalContent>
  )
}
