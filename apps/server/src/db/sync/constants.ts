import { counter, type Tx } from "./core/counter"

/** The `counters` row that orders one board's column/card changes. */
const boardCounterId = (boardId: string) => `board:${boardId}`

/** Per-board column/card counter. */
export const boardCounter = (boardId: string) =>
  counter(boardCounterId(boardId))

/** Account-level board-list counter. */
export const boardsListCounter = () => counter("boards-list")

/** The `counters` row holding a board's next human-readable card number. */
const cardNumberCounterId = (boardId: string) => `cardno:${boardId}`

/**
 * Allocates the next human-readable card number for a board (the `12` in
 * `ROAD-12`), starting at 1.
 */
export async function allocateCardNumber(
  tx: Tx,
  boardId: string
): Promise<number> {
  const c = counter(cardNumberCounterId(boardId))
  const next = (await c.ensure(tx)) + 1
  await c.write(tx, next)
  return next
}
