import type { DropResult } from "@hello-pangea/dnd"
import { useLandingSlot as useSharedLandingSlot } from "@doska/core"

/** Matches the drop transition `draggable-card` sets. */
export const DROP_ANIMATION_MS = 150
const HOLD_FALLBACK_MS = 400

/** The shared landing slot, taking the drop result the board's DnD hands it. */
export function useLandingSlot(enabled: boolean) {
  const { hold, release, place } = useSharedLandingSlot(
    enabled,
    HOLD_FALLBACK_MS
  )

  return {
    hold: ({ destination, draggableId }: DropResult) => {
      if (!destination) return
      hold({
        cardId: draggableId,
        columnId: destination.droppableId,
        index: destination.index,
      })
    },
    release,
    place,
  }
}
