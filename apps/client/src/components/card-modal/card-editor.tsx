import { ModalContent, InvisibleInput, cn } from "@doska/ui-kit"
import { MarkdownTextarea } from "@doska/markdown"
import type { Card } from "@/lib/types"
import { useState } from "react"
import { useToggle } from "@/lib/hooks"
import { CardContentLayout } from "./card-content-layout"
import { CardModalHeader } from "./card-modal-header"

interface IProps {
  id: string
  content: Card
  onSave: (next: Pick<Card, "title" | "body">) => void
  onClose: () => void
}

export function CardEditor({ content, onSave, onClose }: IProps) {
  const [isPreview, togglePreview] = useToggle(false)
  const [draftTitle, setDraftTitle] = useState(content.title)
  const [draftBody, setDraftBody] = useState(content.body)

  const save = () => {
    onSave({ title: draftTitle, body: draftBody })
    onClose()
  }

  return (
    <ModalContent className="md:h-[85vh]">
      <CardModalHeader
        isPreview={isPreview}
        onClose={onClose}
        onSave={save}
        onTogglePreivew={togglePreview}
      />
      <CardContentLayout>
        <InvisibleInput
          autoFocus
          value={draftTitle}
          onChange={(e) => setDraftTitle(e.target.value)}
          placeholder="Title"
          isPreview={isPreview}
          className={cn(
            "border-b-2 border-dashed py-1.5 text-lg font-semibold",
            !isPreview && "font-mono"
          )}
        />
        <MarkdownTextarea
          value={draftBody}
          onChange={(e) => setDraftBody(e.target.value)}
          placeholder="Notes"
          isPreview={isPreview}
        />
      </CardContentLayout>
    </ModalContent>
  )
}
