import { Modal } from "@doska/ui-kit"
import { useState } from "react"
import { useLocation, useRoute } from "wouter"
import { routes } from "@/lib/routes"
import { CardEditor } from "./card-editor"
import { useCard } from "@/lib/data/queries"
import { useUpdateCard } from "@/lib/data/mutations"
import type { Card } from "@/lib/types"

interface IProps {
  /** Where to navigate when the modal closes (its deck root). */
  closeHref: string
}

/** Deadline edits commit straight from {@link CardMeta}, so they never land here. */
type Draft = Partial<Pick<Card, "title" | "body">>

export function CardModal({ closeHref }: IProps) {
  const [, navigate] = useLocation()
  const [, routeParams] = useRoute(routes.card.pattern)
  const routeId = routeParams?.id ?? null

  const [card, setCard] = useState(routeId)
  const [draft, setDraft] = useState<Draft>({})
  const [preview, setPreview] = useState<boolean | null>(null)

  if (routeId && routeId !== card) {
    setCard(routeId)
    setDraft({})
    setPreview(null)
  }

  const { data: content } = useCard(card)
  const { mutate: save } = useUpdateCard(card ?? "")

  const isPreview = preview ?? Boolean(content?.body.trim())

  const close = () => {
    if (content) {
      const next = { ...content, ...draft }
      save({ title: next.title, body: next.body })
    }
    navigate(closeHref)
  }

  return (
    <Modal
      open={routeId != null}
      onOpenChange={(open) => {
        if (!open) close()
      }}
      onOpenChangeComplete={(open) => {
        if (!open) setCard(null)
      }}
    >
      {card && content && (
        <CardEditor
          cardId={card}
          title={draft.title ?? content.title}
          body={draft.body ?? content.body}
          isPreview={isPreview}
          onChangeTitle={(title) => setDraft((d) => ({ ...d, title }))}
          onChangeBody={(body) => setDraft((d) => ({ ...d, body }))}
          onTogglePreview={() => setPreview(!isPreview)}
          onEdit={() => setPreview(false)}
          onClose={close}
        />
      )}
    </Modal>
  )
}
