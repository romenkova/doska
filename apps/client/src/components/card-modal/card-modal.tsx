import { Modal } from "@doska/ui-kit"
import { useState } from "react"
import { useLocation, useRoute } from "wouter"
import { routes } from "@/lib/routes"
import { CardEditor } from "./card-editor"
import { useCard } from "@/lib/data/queries"
import { useUpdateCard } from "@/lib/data/mutations"

interface IProps {
  /** Where to navigate when the modal closes (its deck root). */
  closeHref: string
}

export function CardModal({ closeHref }: IProps) {
  const [, navigate] = useLocation()
  const [, routeParams] = useRoute(routes.card.pattern)
  const routeId = routeParams?.id ?? null

  const [card, setCard] = useState(routeId)
  if (routeId && routeId !== card) setCard(routeId)

  return (
    <Modal
      open={routeId != null}
      onOpenChange={(open) => {
        if (!open) navigate(closeHref)
      }}
      onOpenChangeComplete={(open) => {
        if (!open) setCard(null)
      }}
    >
      {card && (
        <CardEditorLoader
          key={card}
          id={card}
          onClose={() => navigate(closeHref)}
        />
      )}
    </Modal>
  )
}

function CardEditorLoader({
  id,
  onClose,
}: {
  id: string
  onClose: () => void
}) {
  const { data: content } = useCard(id)
  const { mutate: save } = useUpdateCard(id)

  if (content === undefined) return null

  return (
    <CardEditor id={id} content={content} onSave={save} onClose={onClose} />
  )
}
