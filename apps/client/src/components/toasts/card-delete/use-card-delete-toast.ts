import { getCard, useRestore, keys } from "@doska/core"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "react-hot-toast"
import { createElement, useCallback } from "react"
import { useLocation } from "wouter"
import { routes } from "@/lib/routes"
import { CardDeleteToast } from "./card-delete-toast"
import { UNDO_TOASTER_ID } from "./undo-toaster"

interface DeletedCard {
  id: string
  title: string
  reopenPanel: boolean
}

/** Shows a delete/undo toast without requiring application-level state. */
export function useCardDeleteToast() {
  const [, navigate] = useLocation()
  const queryClient = useQueryClient()
  const { mutateAsync: restore } = useRestore()

  const undoDelete = useCallback(
    async (deletedCard: DeletedCard) => {
      await restore({ kind: "cards", id: deletedCard.id })

      if (deletedCard.reopenPanel) {
        await queryClient.fetchQuery({
          queryKey: keys.card(deletedCard.id),
          queryFn: () => getCard(deletedCard.id),
          networkMode: "always",
        })
        navigate(routes.card.to(deletedCard.id))
      }
    },
    [navigate, queryClient, restore]
  )

  const showCardDeleteToast = useCallback(
    (
      id: string,
      {
        title = "Card",
        reopenPanel = false,
      }: { title?: string; reopenPanel?: boolean } = {}
    ) => {
      const deletedCard = { id, title, reopenPanel }
      toast.custom(
        (toastInstance) =>
          createElement(CardDeleteToast, {
            visible: toastInstance.visible,
            title: deletedCard.title,
            onUndo: () => {
              toast.dismiss(toastInstance.id)
              void undoDelete(deletedCard)
            },
          }),
        { duration: 5000, toasterId: UNDO_TOASTER_ID }
      )
    },
    [undoDelete]
  )

  return { showCardDeleteToast }
}
