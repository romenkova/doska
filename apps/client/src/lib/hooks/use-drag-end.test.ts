import { describe, expect, it, vi } from "vitest"
import type { DropResult } from "@hello-pangea/dnd"
import type { Board, Card } from "@doska/core/types"
import { useDragEnd } from "./use-drag-end"

const card = (id: string, columnId: string, fields: Partial<Card> = {}): Card =>
  ({
    id,
    title: id,
    body: "",
    columnId,
    priority: "",
    deadline: null,
    number: null,
    attachments: [],
    updatedAt: 0,
    deletedAt: null,
    ...fields,
  }) as Card

const board = (cards: Card[]): Board => ({ columns: [], cards })

const drop = (fields: Partial<DropResult>): DropResult =>
  ({
    reason: "DROP",
    mode: "FLUID",
    combine: null,
    draggableId: "moved",
    type: "DEFAULT",
    source: { droppableId: "todo", index: 0 },
    destination: { droppableId: "todo", index: 0 },
    ...fields,
  }) as DropResult

function moved(call: ReturnType<typeof vi.fn>) {
  return call.mock.calls[0]?.[0]?.[0] as Card | undefined
}

describe("useDragEnd", () => {
  describe("sort off (regression guard)", () => {
    it("a same-column drop lands at the drop index", () => {
      const cards = [
        card("a", "todo", { position: "a0" }),
        card("moved", "todo", { position: "a1" }),
        card("c", "todo", { position: "a2" }),
      ]
      const moveCard = vi.fn()
      const handleDragEnd = useDragEnd(board(cards), moveCard, [])

      handleDragEnd(
        drop({
          source: { droppableId: "todo", index: 1 },
          destination: { droppableId: "todo", index: 0 },
        })
      )

      expect(moveCard).toHaveBeenCalledTimes(1)
      expect(moved(moveCard)?.columnId).toBe("todo")
      expect(moved(moveCard)?.position).toBe("Zz")
    })

    it("a cross-column drop lands at the drop index", () => {
      const cards = [
        card("moved", "todo", { position: "a0" }),
        card("x", "doing", { position: "a0" }),
        card("y", "doing", { position: "a1" }),
      ]
      const moveCard = vi.fn()
      const handleDragEnd = useDragEnd(board(cards), moveCard, [])

      handleDragEnd(
        drop({
          source: { droppableId: "todo", index: 0 },
          destination: { droppableId: "doing", index: 1 },
        })
      )

      expect(moveCard).toHaveBeenCalledTimes(1)
      expect(moved(moveCard)?.columnId).toBe("doing")
      expect(moved(moveCard)?.position).toBe("a0V")
    })
  })

  describe("tag filter on", () => {
    it("a drop lands between the visible neighbours, not the hidden ones", () => {
      const cards = [
        card("a", "todo", { position: "a0", body: "#bug" }),
        card("hidden", "todo", { position: "a1" }),
        card("c", "todo", { position: "a2", body: "#bug" }),
        card("moved", "todo", { position: "a3", body: "#bug" }),
      ]
      const moveCard = vi.fn()
      const handleDragEnd = useDragEnd(board(cards), moveCard, [], ["bug"])

      handleDragEnd(
        drop({
          source: { droppableId: "todo", index: 2 },
          destination: { droppableId: "todo", index: 1 },
        })
      )

      // Right after "a", ahead of the hidden card: a key between "a" and "c"
      // would be "a1", tying with it.
      const position = moved(moveCard)?.position ?? ""
      expect(position > "a0" && position < "a1").toBe(true)
    })
  })

  describe("sort on", () => {
    it("a same-column drop still writes a fresh position (current behavior — see conversation)", () => {
      // Task 06's spec calls for a no-op here, but the shipped code has no
      // early exit for a same-column drop while sorted: it mints a position
      // among the moved card's same-priority tier regardless. Documented as
      // actual behavior per explicit direction, not endorsed as correct.
      const cards = [
        card("moved", "todo", { position: "a0", priority: "high" }),
        card("b", "todo", { position: "a1", priority: "high" }),
        card("c", "todo", { position: "a3", priority: "low" }),
      ]
      const moveCard = vi.fn()
      const handleDragEnd = useDragEnd(board(cards), moveCard, ["priority"])

      handleDragEnd(
        drop({
          source: { droppableId: "todo", index: 0 },
          destination: { droppableId: "todo", index: 2 },
        })
      )

      expect(moveCard).toHaveBeenCalledTimes(1)
      expect(moved(moveCard)?.position).toBe("a2")
    })

    it("a cross-column drop lands above the destination's top regardless of destination.index, when the moved card ties with nothing there", () => {
      const cards = [
        card("moved", "todo", { position: "a0", priority: "medium" }),
        card("top", "doing", { position: "a0", priority: "high" }),
        card("bottom", "doing", { position: "a1", priority: "low" }),
      ]
      const moveCard = vi.fn()
      const handleDragEnd = useDragEnd(board(cards), moveCard, ["priority"])

      for (const destIndex of [0, 1, 2]) {
        handleDragEnd(
          drop({
            source: { droppableId: "todo", index: 0 },
            destination: { droppableId: "doing", index: destIndex },
          })
        )
      }

      expect(moveCard).toHaveBeenCalledTimes(3)
      for (const call of moveCard.mock.calls) {
        // A key minted against the destination's top, not the base key: cards
        // arrive at "a0", so minting that again would tie with one of them and
        // leave the order undefined once the sort is cleared.
        expect(call[0][0].position).toBe("Zz")
        expect(call[0][0].position < "a0").toBe(true)
      }
    })
  })
})
