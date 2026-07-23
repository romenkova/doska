import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import type { Change, Column } from "@doska/contract"
import { z } from "zod"
import { type Board, newId, positionAt, tombstone, touch } from "../board"
import { reply } from "./reply"

export function registerColumnTools(server: McpServer, board: Board): void {
  server.registerTool(
    "create_column",
    {
      title: "Create column",
      description: "Append a column to the right-hand end of a board.",
      inputSchema: { boardId: z.string(), title: z.string() },
    },
    async ({ boardId, title }) => {
      const { columns } = await board.board(boardId)
      const column: Column = {
        id: newId("col"),
        title,
        position: positionAt(columns, "bottom"),
        dashboardId: boardId,
        collapsed: false,
        done: false,
        color: "",
        updatedAt: Date.now(),
        deletedAt: null,
      }
      await board.pushBoard(boardId, [{ store: "columns", record: column }])
      return reply(column)
    }
  )

  server.registerTool(
    "rename_column",
    {
      title: "Rename column",
      description: "Change a column's title.",
      inputSchema: {
        boardId: z.string(),
        columnId: z.string(),
        title: z.string(),
      },
    },
    async ({ boardId, columnId, title }) => {
      const column = touch({
        ...(await board.column(boardId, columnId)),
        title,
      })
      await board.pushBoard(boardId, [{ store: "columns", record: column }])
      return reply(column)
    }
  )

  server.registerTool(
    "delete_column",
    {
      title: "Delete column",
      description:
        "Delete a column along with every card in it. This syncs to every device.",
      inputSchema: { boardId: z.string(), columnId: z.string() },
    },
    async ({ boardId, columnId }) => {
      const column = await board.column(boardId, columnId)
      const { cards } = await board.board(boardId)
      const inColumn = cards.filter((card) => card.columnId === columnId)

      const changes: Change[] = [
        { store: "columns", record: tombstone(column) },
        ...inColumn.map(
          (record): Change => ({ store: "cards", record: tombstone(record) })
        ),
      ]
      await board.pushBoard(boardId, changes)

      return reply({ deleted: column.id, cards: inColumn.length })
    }
  )
}
