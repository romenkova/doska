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

type Draft = Partial<Pick<Card, "title" | "body" | "locked" | "deadline">>

/**
 * Loads the card and renders the presentational editor. Edits are kept as an
 * overlay on the loaded card (so nothing needs to be seeded from async data),
 * and every close — Close button, backdrop, or Esc — runs the one `close` here,
 * which persists the draft (skipping a no-op write) before navigating away.
 */
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

  const close = () => {
    if (content) {
      const next = { ...content, ...draft }
      save({
        title: next.title,
        body: next.body,
        locked: next.locked,
        deadline: next.deadline,
      })
    }
    navigate(closeHref)
  }

  const isLocked = draft.locked ?? content?.locked ?? false
  const isPreview = preview ?? content?.locked ?? false

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
          title={draft.title ?? content.title}
          body={draft.body ?? content.body}
          deadline={"deadline" in draft ? draft.deadline! : content.deadline}
          isPreview={isPreview}
          isLocked={isLocked}
          onChangeTitle={(title) => setDraft((d) => ({ ...d, title }))}
          onChangeBody={(body) => setDraft((d) => ({ ...d, body }))}
          onChangeDeadline={(deadline) => setDraft((d) => ({ ...d, deadline }))}
          onToggleLock={() => {
            setDraft((d) => ({ ...d, locked: !isLocked }))
            setPreview(true)
          }}
          onTogglePreview={() => setPreview(!isPreview)}
          onClose={close}
        />
      )}
    </Modal>
  )
}
