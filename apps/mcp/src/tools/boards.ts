import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import type { Change, Column, Dashboard } from "@doska/contract"
import { z } from "zod"
import {
  newId,
  positionAt,
  pushBoard,
  pushDashboards,
  readBoard,
  readDashboard,
  readDashboards,
  tombstone,
  touch,
} from "../board"
import { reply } from "./reply"

/** What a new board starts with, matching the app's own default columns. */
const DEFAULT_COLUMNS = ["To Do", "In Progress", "Done"]

export function registerBoardTools(server: McpServer): void {
  server.registerTool(
    "list_boards",
    {
      title: "List boards",
      description: "List every board, with its id and title.",
      inputSchema: {},
    },
    async () => reply(await readDashboards())
  )

  server.registerTool(
    "get_board",
    {
      title: "Get board",
      description:
        "Read a board in full: its columns in order, each with its cards in order, including card bodies (Markdown).",
      inputSchema: { boardId: z.string() },
    },
    async ({ boardId }) => {
      const { columns, cards } = await readBoard(boardId)
      return reply({
        boardId,
        columns: columns.map((column) => ({
          id: column.id,
          title: column.title,
          cards: cards
            .filter((card) => card.columnId === column.id)
            .map(({ id, title, body, deadline, attachments }) => ({
              id,
              title,
              body,
              deadline,
              // Names and types only — the bytes live behind the file endpoints.
              attachments: attachments.map(({ name, mime, size }) => ({
                name,
                mime,
                size,
              })),
            })),
        })),
      })
    }
  )

  server.registerTool(
    "create_board",
    {
      title: "Create board",
      description:
        "Create a board with the default To Do / In Progress / Done columns.",
      inputSchema: { title: z.string() },
    },
    async ({ title }) => {
      const boards = await readDashboards()
      const board: Dashboard = {
        id: newId("board"),
        title,
        position: positionAt(boards, "bottom"),
        updatedAt: Date.now(),
        deletedAt: null,
      }
      await pushDashboards([{ store: "dashboards", record: board }])

      // Columns live on the board's own sync channel, so they go in a second push.
      const columns: Column[] = []
      for (const columnTitle of DEFAULT_COLUMNS) {
        columns.push({
          id: newId("col"),
          title: columnTitle,
          position: positionAt(columns, "bottom"),
          dashboardId: board.id,
          collapsed: false,
          updatedAt: Date.now(),
          deletedAt: null,
        })
      }
      await pushBoard(
        board.id,
        columns.map((record) => ({ store: "columns", record }))
      )

      return reply({ board, columns })
    }
  )

  server.registerTool(
    "rename_board",
    {
      title: "Rename board",
      description: "Change a board's title.",
      inputSchema: { boardId: z.string(), title: z.string() },
    },
    async ({ boardId, title }) => {
      const board = touch({ ...(await readDashboard(boardId)), title })
      await pushDashboards([{ store: "dashboards", record: board }])
      return reply(board)
    }
  )

  server.registerTool(
    "delete_board",
    {
      title: "Delete board",
      description:
        "Delete a board along with all of its columns and cards. This syncs to every device.",
      inputSchema: { boardId: z.string() },
    },
    async ({ boardId }) => {
      const board = await readDashboard(boardId)
      const { columns, cards } = await readBoard(boardId)

      const changes: Change[] = [
        ...columns.map(
          (record): Change => ({ store: "columns", record: tombstone(record) })
        ),
        ...cards.map(
          (record): Change => ({ store: "cards", record: tombstone(record) })
        ),
      ]
      await pushBoard(boardId, changes)
      await pushDashboards([{ store: "dashboards", record: tombstone(board) }])

      return reply({
        deleted: board.id,
        columns: columns.length,
        cards: cards.length,
      })
    }
  )
}
