import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import type { Card } from "@doska/contract"
import { cardDisplayId } from "@doska/contract"
import { z } from "zod"
import { type Board, newId, positionAt, tombstone, touch } from "../board"
import { reply } from "./reply"

const deadline = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use an ISO date, e.g. 2026-07-31")
  .nullable()

const place = z
  .enum(["top", "bottom"])
  .describe("Which end of the column the card lands on")

export function registerCardTools(server: McpServer, board: Board): void {
  server.registerTool(
    "create_card",
    {
      title: "Create card",
      description:
        "Add a card to a column. The body is GitHub-flavored Markdown and may include task lists.",
      inputSchema: {
        boardId: z.string(),
        columnId: z.string(),
        title: z.string(),
        body: z.string().optional(),
        deadline: deadline.optional(),
        place: place.default("top"),
      },
    },
    async ({ boardId, columnId, title, body, deadline, place }) => {
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
        attachments: [],
        updatedAt: Date.now(),
        deletedAt: null,
      }
      await board.pushBoard(boardId, [{ store: "cards", record: card }])

      // The server stamps the number on write; re-read to surface the id.
      const { prefix } = await board.dashboard(boardId)
      const stored = await board.card(boardId, card.id)
      return reply({ ...stored, cardId: cardDisplayId(prefix, stored.number) })
    }
  )

  server.registerTool(
    "update_card",
    {
      title: "Update card",
      description:
        "Edit a card's title, body, or deadline. Omitted fields are left alone; pass a null deadline to clear it.",
      inputSchema: {
        boardId: z.string(),
        cardId: z.string(),
        title: z.string().optional(),
        body: z.string().optional(),
        deadline: deadline.optional(),
      },
    },
    async ({ boardId, cardId, title, body, deadline }) => {
      const existing = await board.card(boardId, cardId)
      const card = touch({
        ...existing,
        title: title ?? existing.title,
        body: body ?? existing.body,
        deadline: deadline === undefined ? existing.deadline : deadline,
      })
      await board.pushBoard(boardId, [{ store: "cards", record: card }])
      return reply(card)
    }
  )

  server.registerTool(
    "move_card",
    {
      title: "Move card",
      description:
        "Move a card to another column, or to the other end of the one it is in.",
      inputSchema: {
        boardId: z.string(),
        cardId: z.string(),
        columnId: z.string().optional(),
        place: place.default("top"),
      },
    },
    async ({ boardId, cardId, columnId, place }) => {
      const { cards } = await board.board(boardId)
      const existing = cards.find((c) => c.id === cardId)
      if (!existing) throw new Error(`No card ${cardId} on board ${boardId}`)

      const target = columnId ?? existing.columnId
      if (columnId) await board.column(boardId, columnId)

      const card = touch({
        ...existing,
        columnId: target,
        position: positionAt(
          cards.filter((c) => c.columnId === target && c.id !== cardId),
          place
        ),
      })
      await board.pushBoard(boardId, [{ store: "cards", record: card }])
      return reply(card)
    }
  )

  server.registerTool(
    "delete_card",
    {
      title: "Delete card",
      description: "Delete a card. This syncs to every device.",
      inputSchema: { boardId: z.string(), cardId: z.string() },
    },
    async ({ boardId, cardId }) => {
      const card = tombstone(await board.card(boardId, cardId))
      await board.pushBoard(boardId, [{ store: "cards", record: card }])
      return reply({ deleted: card.id })
    }
  )
}
