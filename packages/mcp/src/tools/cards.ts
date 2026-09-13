import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import type { Card } from "@doska/contract"
import { taskProgress, toggleTaskByIndex } from "@doska/markdown/core"
import { PRIORITIES } from "@doska/tokens/priority"
import { z } from "zod"
import {
  type Board,
  doneColumn,
  newId,
  openColumn,
  positionAt,
  positionNextTo,
  tombstone,
  touch,
} from "../board"
import { reply } from "./reply"
import { shapeCard } from "./shape"

const deadline = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use an ISO date, e.g. 2026-07-31")
  .nullable()
  .describe("Calendar date, no time — this is what the upcoming view lists")

export const PRIORITY_IDS = PRIORITIES.map((p) => p.id) as [string, ...string[]]

const priority = z
  .enum(PRIORITY_IDS)
  .nullable()
  .describe("How important the card is; null or omitted for none")

const cardId = z
  .string()
  .describe(
    "The card's own id, from get_board or search_cards. " +
      "A card's [[12]] reference number is not one."
  )

const place = z
  .enum(["top", "bottom"])
  .describe("Which end of the column the card lands on")

export function registerCardTools(server: McpServer, board: Board): void {
  server.registerTool(
    "create_card",
    {
      title: "Create card",
      description:
        "Add a card to a column. The body is Markdown in the board's " +
        "dialect — task lists, [[12]] card links, " +
        "==highlight==, and a -cut- line ending the board preview.",
      inputSchema: {
        boardId: z.string(),
        columnId: z.string(),
        title: z.string(),
        body: z.string().optional(),
        deadline: deadline.optional(),
        priority: priority.optional(),
        place: place.default("top"),
      },
    },
    async ({ boardId, columnId, title, body, deadline, priority, place }) => {
      const { cards } = await board.board(boardId)
      await board.column(boardId, columnId) // Reject an unknown column before writing.

      const card: Card = {
        id: newId("card"),
        title,
        body: body ?? "",
        position: positionAt(
          cards.filter((c) => c.columnId === columnId),
          place
        ),
        columnId,
        number: null,
        deadline: deadline ?? null,
        priority: priority ?? "",
        attachments: [],
        updatedAt: board.now(),
        deletedAt: null,
        stamps: {},
        bodyConflict: null,
      }
      await board.pushBoard(boardId, [{ store: "cards", record: card }])

      // The server stamps the number on write; re-read to surface the id.
      return reply(shapeCard(await board.card(boardId, card.id)))
    }
  )

  server.registerTool(
    "update_card",
    {
      title: "Update card",
      description:
        "Edit a card's title, body, deadline, or priority. Omitted fields " +
        "are left alone; pass a null deadline or priority to clear it. " +
        "`append` adds to the end " +
        "of the body instead of replacing it, which is the safe way to add " +
        "a note to a card you haven't read.",
      inputSchema: {
        boardId: z.string(),
        cardId,
        title: z.string().optional(),
        body: z.string().optional(),
        append: z
          .string()
          .optional()
          .describe(
            "Markdown appended as a new block. Ignored if `body` is set"
          ),
        deadline: deadline.optional(),
        priority: priority.optional(),
      },
    },
    async ({ boardId, cardId, title, body, append, deadline, priority }) => {
      const existing = await board.card(boardId, cardId)

      let nextBody = body ?? existing.body
      if (body === undefined && append)
        nextBody = existing.body
          ? `${existing.body.trimEnd()}\n\n${append}`
          : append

      const card = touch(
        {
          ...existing,
          title: title ?? existing.title,
          body: nextBody,
          deadline: deadline === undefined ? existing.deadline : deadline,
          priority:
            priority === undefined ? existing.priority : (priority ?? ""),
        },
        board.now()
      )
      await board.pushBoard(boardId, [{ store: "cards", record: card }])
      return reply(shapeCard(card))
    }
  )

  server.registerTool(
    "move_card",
    {
      title: "Move card",
      description:
        "Move a card to another column, or reorder it within its own. To " +
        "mark work finished use set_card_done instead — it knows which " +
        "column the board treats as done.",
      inputSchema: {
        boardId: z.string(),
        cardId,
        columnId: z
          .string()
          .optional()
          .describe("Target column. Defaults to the one the card is in"),
        place: place.default("top"),
        anchorCardId: cardId
          .optional()
          .describe(
            "Sit directly above this card instead of at an end of the column"
          ),
      },
    },
    async ({ boardId, cardId, columnId, place, anchorCardId }) => {
      const existing = await board.card(boardId, cardId)
      const target = columnId ?? existing.columnId
      if (columnId) await board.column(boardId, columnId)

      const card = touch(
        {
          ...existing,
          columnId: target,
          position: await positionInColumn(board, boardId, {
            columnId: target,
            movingId: existing.id,
            place,
            anchorId: anchorCardId,
          }),
        },
        board.now()
      )
      await board.pushBoard(boardId, [{ store: "cards", record: card }])
      return reply(shapeCard(card))
    }
  )

  server.registerTool(
    "set_card_done",
    {
      title: "Mark card done",
      description:
        "Move a card into the board's done column, or back out of it — " +
        "what ticking a card off means on this board. Fails if no column " +
        "is marked done; set one with update_column.",
      inputSchema: {
        boardId: z.string(),
        cardId,
        done: z.boolean().default(true),
      },
    },
    async ({ boardId, cardId, done }) => {
      const { columns, cards } = await board.board(boardId)
      const existing = await board.card(boardId, cardId)

      // Un-marking sends the card to the leftmost unfinished column, the same
      // destination the app's upcoming view uses.
      const target = done ? doneColumn(columns) : openColumn(columns)
      if (!target)
        throw new Error(
          done
            ? `Board ${boardId} has no done column. Mark one with update_column.`
            : `Board ${boardId} has no column outside done to move this back to.`
        )
      if (existing.columnId === target.id)
        return reply({ ...shapeCard(existing), column: target.title })

      const card = touch(
        {
          ...existing,
          columnId: target.id,
          position: positionAt(
            cards.filter((c) => c.columnId === target.id),
            "top"
          ),
        },
        board.now()
      )
      await board.pushBoard(boardId, [{ store: "cards", record: card }])
      return reply({ ...shapeCard(card), column: target.title })
    }
  )

  server.registerTool(
    "check_task",
    {
      title: "Check task",
      description:
        "Tick or untick one task-list checkbox in a card's body, by its " +
        "0-based position in document order — the order get_card lists " +
        "them in. Use this rather than rewriting the body, so nothing else " +
        "on the card is disturbed.",
      inputSchema: {
        boardId: z.string(),
        cardId,
        index: z.number().int().min(0),
        checked: z.boolean().default(true),
      },
    },
    async ({ boardId, cardId, index, checked }) => {
      const existing = await board.card(boardId, cardId)
      const before = taskProgress(existing.body)
      if (index >= before.total)
        throw new Error(
          `Card ${cardId} has ${before.total} task${before.total === 1 ? "" : "s"}, so there is no task ${index}`
        )

      // The helper only toggles, so check where a toggle would land: if it
      // wouldn't reach the requested state, the box is already there.
      const toggled = toggleTaskByIndex(existing.body, index)
      const toggledTo = taskProgress(toggled).done > before.done
      if (toggledTo !== checked) return reply(shapeCard(existing))

      const card = touch({ ...existing, body: toggled }, board.now())
      await board.pushBoard(boardId, [{ store: "cards", record: card }])
      return reply(shapeCard(card))
    }
  )

  server.registerTool(
    "delete_card",
    {
      title: "Delete card",
      description:
        "Delete a card. This syncs to every device and cannot be undone.",
      inputSchema: { boardId: z.string(), cardId },
    },
    async ({ boardId, cardId }) => {
      const card = tombstone(await board.card(boardId, cardId), board.now())
      await board.pushBoard(boardId, [{ store: "cards", record: card }])
      return reply({ deleted: card.id })
    }
  )
}

/** Where a card lands in a column: next to an anchor card if one is named, else
 * at the requested end. The moving card is never its own neighbour. */
async function positionInColumn(
  board: Board,
  boardId: string,
  opts: {
    columnId: string
    movingId: string
    place: "top" | "bottom"
    anchorId?: string
  }
): Promise<string> {
  const { cards } = await board.board(boardId)
  const siblings = cards.filter(
    (c) => c.columnId === opts.columnId && c.id !== opts.movingId
  )
  if (!opts.anchorId) return positionAt(siblings, opts.place)

  const anchor = await board.card(boardId, opts.anchorId)
  if (anchor.columnId !== opts.columnId)
    throw new Error(`Card ${opts.anchorId} is not in the target column`)
  return positionNextTo(siblings, anchor.id, "before")
}
