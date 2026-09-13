import { useEffect, useState } from "react"
import type { CardPatch } from "@doska/core/mutations"
import type { Card } from "@doska/core/types"
import { CardEditor } from "./card-editor"
import { ConflictBanner } from "./conflict-banner"
import { rebaseDraft, type DraftState } from "./draft"

interface IProps {
  cardId: string
  content: Card
  onQueue: (id: string, patch: CardPatch) => void
  onFlush: () => void
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
  onFlush,
  bare = false,
  onClose,
  onDelete,
  onReveal,
  onPopOut,
  inWindow,
}: IProps) {
  const [draft, setDraft] = useState<DraftState>(() => ({
    base: content.body,
  }))
  const rebased = rebaseDraft(draft, content.body)
  if (rebased !== draft) setDraft(rebased)

  // Queued from here, not the change handler, so typing a pull rebased goes out rebased.
  const typed = rebased.body
  useEffect(() => {
    if (typed !== undefined) onQueue(cardId, { body: typed })
  }, [typed, cardId, onQueue])

  const [isPreview, setPreview] = useState(
    () => !bare && Boolean(content.body.trim())
  )

  const resolve = (patch: CardPatch) => {
    onQueue(cardId, patch)
    onFlush()
  }

  const { bodyConflict } = content

  return (
    <CardEditor
      cardId={cardId}
      title={rebased.title ?? content.title}
      body={typed ?? content.body}
      isPreview={isPreview}
      notice={
        bodyConflict && (
          <ConflictBanner
            body={typed ?? content.body}
            conflict={bodyConflict}
            onKeepMine={() => resolve({ bodyConflict: null })}
            onUseTheirs={() => {
              setDraft(({ base, title }) => ({ base, title }))
              resolve({ body: bodyConflict.body, bodyConflict: null })
            }}
          />
        )
      }
      onChangeTitle={(title) => {
        setDraft((d) => ({ ...d, title }))
        onQueue(cardId, { title })
      }}
      onChangeBody={(body) => setDraft((d) => ({ ...d, body }))}
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
