import { useState } from "react"
import { CardEditor } from "./card-editor"
import type { Card } from "@/lib/types"

/** Backs the textareas only: round-tripping each keystroke would lag the caret. */
export type Draft = Partial<Pick<Card, "title" | "body">>

interface IProps {
  cardId: string
  content: Card
  onQueue: (id: string, patch: Draft) => void
  onClose: () => void
}

/** One card's editing session. Mount it keyed by `cardId`. */
export function CardPane({ cardId, content, onQueue, onClose }: IProps) {
  const [draft, setDraft] = useState<Draft>({})
  // Decided at mount, never re-derived: once you type, `content.body` is no
  // longer evidence the card opened with notes.
  const [isPreview, setPreview] = useState(() => Boolean(content.body.trim()))

  const edit = (patch: Draft) => {
    setDraft((d) => ({ ...d, ...patch }))
    onQueue(cardId, patch)
  }

  return (
    <CardEditor
      cardId={cardId}
      title={draft.title ?? content.title}
      body={draft.body ?? content.body}
      isPreview={isPreview}
      onChangeTitle={(title) => edit({ title })}
      onChangeBody={(body) => edit({ body })}
      onTogglePreview={() => setPreview(!isPreview)}
      onEdit={() => setPreview(false)}
      onClose={onClose}
    />
  )
}
