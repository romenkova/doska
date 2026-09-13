import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import type { Change, Column } from "@doska/contract"
import { COLUMN_COLORS } from "@doska/tokens/columns"
import { z } from "zod"
import {
  type Board,
  newId,
  positionAt,
  positionNextTo,
  tombstone,
  touch,
} from "../board"
import { reply } from "./reply"

const COLOR_IDS = COLUMN_COLORS.map((c) => c.id) as [string, ...string[]]

const color = z
  .enum(COLOR_IDS)
  .nullable()
  .describe("Palette tint for the column and any [[card]] linking into it")

export function registerColumnTools(server: McpServer, board: Board): void {
  server.registerTool(
    "create_column",
    {
      title: "Create column",
      description: "Append a column to the right-hand end of a board.",
      inputSchema: {
        boardId: z.string(),
        title: z.string(),
        color: color.optional(),
        done: z
          .boolean()
          .default(false)
          .describe("Make this the board's done column, clearing any other"),
      },
    },
    async ({ boardId, title, color, done }) => {
      const { columns } = await board.board(boardId)
      const now = board.now()
      const column: Column = {
        id: newId("col"),
        title,
        position: positionAt(columns, "bottom"),
        dashboardId: boardId,
        collapsed: false,
        done,
        color: color ?? "",
        updatedAt: now,
        deletedAt: null,
        stamps: {},
      }
      const changes: Change[] = [{ store: "columns", record: column }]
      if (done) changes.push(...clearOtherDone(columns, column.id, now))

      await board.pushBoard(boardId, changes)
      return reply(column)
    }
  )

  server.registerTool(
    "update_column",
    {
      title: "Update column",
      description:
        "Change a column's title, color, collapsed state, or whether it is " +
        "the board's done column. Omitted fields are left alone; a null " +
        "color clears it. Only one column per board can be done, so " +
        "marking one clears the rest.",
      inputSchema: {
        boardId: z.string(),
        columnId: z.string(),
        title: z.string().optional(),
        color: color.optional(),
        collapsed: z
          .boolean()
          .optional()
          .describe("Collapsed columns show card titles without their bodies"),
        done: z.boolean().optional(),
      },
    },
    async ({ boardId, columnId, title, color, collapsed, done }) => {
      const { columns } = await board.board(boardId)
      const existing = await board.column(boardId, columnId)

      const now = board.now()
      const column = touch(
        {
          ...existing,
          title: title ?? existing.title,
          color: color === undefined ? existing.color : (color ?? ""),
          collapsed: collapsed ?? existing.collapsed,
          done: done ?? existing.done,
        },
        now
      )
      const changes: Change[] = [{ store: "columns", record: column }]
      if (column.done) changes.push(...clearOtherDone(columns, column.id, now))

      await board.pushBoard(boardId, changes)
      return reply(column)
    }
  )

  server.registerTool(
    "move_column",
    {
      title: "Move column",
      description:
        "Reorder a column: to either end of the board, or next to another column.",
      inputSchema: {
        boardId: z.string(),
        columnId: z.string(),
        place: z
          .enum(["left", "right", "before", "after"])
          .describe("`before` / `after` need an `anchorColumnId`"),
        anchorColumnId: z
          .string()
          .optional()
          .describe("The column to sit next to, for `before` / `after`"),
      },
    },
    async ({ boardId, columnId, place, anchorColumnId }) => {
      const { columns } = await board.board(boardId)
      const existing = await board.column(boardId, columnId)
      const siblings = columns.filter((c) => c.id !== columnId)

      let position: string
      if (place === "left") position = positionAt(siblings, "top")
      else if (place === "right") position = positionAt(siblings, "bottom")
      else {
        if (!anchorColumnId)
          throw new Error(`Place '${place}' needs an anchorColumnId`)
        position = positionNextTo(siblings, anchorColumnId, place)
      }

      const column = touch({ ...existing, position }, board.now())
      await board.pushBoard(boardId, [{ store: "columns", record: column }])
      return reply(column)
    }
  )

  server.registerTool(
    "delete_column",
    {
      title: "Delete column",
      description:
        "Delete a column along with every card in it. This syncs to every " +
        "device and cannot be undone.",
      inputSchema: { boardId: z.string(), columnId: z.string() },
    },
    async ({ boardId, columnId }) => {
      const column = await board.column(boardId, columnId)
      const { cards } = await board.board(boardId)
      const inColumn = cards.filter((card) => card.columnId === columnId)

      const now = board.now()
      const changes: Change[] = [
        { store: "columns", record: tombstone(column, now) },
        ...inColumn.map((record): Change => ({
          store: "cards",
          record: tombstone(record, now),
        })),
      ]
      await board.pushBoard(boardId, changes)

      return reply({ deleted: column.id, cards: inColumn.length })
    }
  )
}

/** "Move this card to done" needs a single answer, so a board has at most one
 * done column: marking one clears the flag from every other. */
function clearOtherDone(
  columns: Column[],
  keepId: string,
  now: number
): Change[] {
  return columns
    .filter((c) => c.done && c.id !== keepId)
    .map((c) => ({
      store: "columns",
      record: touch({ ...c, done: false }, now),
    }))
}
