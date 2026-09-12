import { useState } from "react"
import { CardEditor } from "./card-editor"
import type { Card } from "@doska/core/types"

/** Backs the textareas only: round-tripping each keystroke would lag the caret. */
export type Draft = Partial<Pick<Card, "title" | "body">>

interface IProps {
  cardId: string
  content: Card
  onQueue: (id: string, patch: Draft) => void
  /** Just the editor: no header */
  bare?: boolean
  onClose: () => void
  onDelete?: () => void
  onReveal?: () => void
  onPopOut?: () => void
  inWindow?: boolean
}

/** One card's editing session. Mount it keyed by `cardId`. */
export function CardPane({
  cardId,
  content,
  onQueue,
  bare = false,
  onClose,
  onDelete,
  onReveal,
  onPopOut,
  inWindow,
}: IProps) {
  const [draft, setDraft] = useState<Draft>({})

  const title = draft.title === content.title ? undefined : draft.title
  const body = draft.body === content.body ? undefined : draft.body
  if (title !== draft.title || body !== draft.body) setDraft({ title, body })

  const [isPreview, setPreview] = useState(
    () => !bare && Boolean(content.body.trim())
  )

  const edit = (patch: Draft) => {
    setDraft((d) => ({ ...d, ...patch }))
    onQueue(cardId, patch)
  }

  return (
    <CardEditor
      cardId={cardId}
      title={title ?? content.title}
      body={body ?? content.body}
      isPreview={isPreview}
      onChangeTitle={(title) => edit({ title })}
      onChangeBody={(body) => edit({ body })}
      onTogglePreview={bare ? undefined : () => setPreview(!isPreview)}
      withHeader={!bare}
      onEdit={() => setPreview(false)}
      onClose={onClose}
      onDelete={onDelete}
      onReveal={onReveal}
      onPopOut={onPopOut}
      inWindow={inWindow}
    />
  )
}
