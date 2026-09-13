import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import type { Change, Column, Dashboard } from "@doska/contract"
import { z } from "zod"
import { type Board, newId, positionAt, tombstone, touch } from "../board"
import { reply } from "./reply"
import { shapeCard } from "./shape"

/** What a new board starts with, matching the app's own default columns. */
const DEFAULT_COLUMNS = ["To Do", "In Progress", "Done"]

export function registerBoardTools(server: McpServer, board: Board): void {
  server.registerTool(
    "list_boards",
    {
      title: "List boards",
      description: "List every board, with its id and title.",
      inputSchema: {},
    },
    async () => reply(await board.dashboards())
  )

  server.registerTool(
    "get_board",
    {
      title: "Get board",
      description:
        "Read a board in full: its columns left to right — with their " +
        "color, and which one is the done column — each holding its cards " +
        "top to bottom with Markdown bodies, deadlines and task-list " +
        "progress. Pass bodies: false for an outline of a large board.",
      inputSchema: {
        boardId: z.string(),
        bodies: z
          .boolean()
          .default(true)
          .describe("Include card bodies. Titles only when false."),
      },
    },
    async ({ boardId, bodies }) => {
      const { title } = await board.dashboard(boardId)
      const { columns, cards } = await board.board(boardId)
      return reply({
        boardId,
        title,
        columns: columns.map((column) => ({
          id: column.id,
          title: column.title,
          done: column.done,
          color: column.color || null,
          collapsed: column.collapsed,
          cards: cards
            .filter((card) => card.columnId === column.id)
            .map((card) => {
              const shaped = shapeCard(card)
              return bodies ? shaped : { ...shaped, body: undefined }
            }),
        })),
      })
    }
  )

  server.registerTool(
    "get_card",
    {
      title: "Get card",
      description:
        "Read one card without pulling the whole board. Takes the card's " +
        "own id — search_cards finds it from a card number or a few words.",
      inputSchema: { boardId: z.string(), cardId: z.string() },
    },
    async ({ boardId, cardId }) => {
      const card = await board.card(boardId, cardId)
      const column = await board.column(boardId, card.columnId)
      return reply({
        ...shapeCard(card),
        column: { id: column.id, title: column.title, done: column.done },
      })
    }
  )

  server.registerTool(
    "create_board",
    {
      title: "Create board",
      description:
        "Create a board with the default To Do / In Progress / Done " +
        "columns. As in the app, none of them is flagged as the done " +
        "column yet — mark one with update_column if the board should " +
        "support set_card_done.",
      inputSchema: { title: z.string() },
    },
    async ({ title }) => {
      const existing = await board.dashboards()
      const dashboard: Dashboard = {
        id: newId("board"),
        title,
        position: positionAt(existing, "bottom"),
        sort: [],
        updatedAt: board.now(),
        deletedAt: null,
      }
      await board.pushDashboards([{ store: "dashboards", record: dashboard }])

      // Columns live on the board's own sync channel, so they go in a second push.
      const columns: Column[] = []
      for (const columnTitle of DEFAULT_COLUMNS) {
        columns.push({
          id: newId("col"),
          title: columnTitle,
          position: positionAt(columns, "bottom"),
          dashboardId: dashboard.id,
          collapsed: false,
          done: false,
          color: "",
          updatedAt: board.now(),
          deletedAt: null,
          stamps: {},
        })
      }
      await board.pushBoard(
        dashboard.id,
        columns.map((record) => ({ store: "columns", record }))
      )

      return reply({ board: dashboard, columns })
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
      const dashboard = touch(
        { ...(await board.dashboard(boardId)), title },
        board.now()
      )
      await board.pushDashboards([{ store: "dashboards", record: dashboard }])
      return reply(dashboard)
    }
  )

  server.registerTool(
    "delete_board",
    {
      title: "Delete board",
      description:
        "Delete a board along with all of its columns and cards. This " +
        "syncs to every device and cannot be undone.",
      inputSchema: { boardId: z.string() },
    },
    async ({ boardId }) => {
      const dashboard = await board.dashboard(boardId)
      const { columns, cards } = await board.board(boardId)

      const now = board.now()
      const changes: Change[] = [
        ...columns.map((record): Change => ({
          store: "columns",
          record: tombstone(record, now),
        })),
        ...cards.map((record): Change => ({
          store: "cards",
          record: tombstone(record, now),
        })),
      ]
      await board.pushBoard(boardId, changes)
      await board.pushDashboards([
        { store: "dashboards", record: tombstone(dashboard, now) },
      ])

      return reply({
        deleted: dashboard.id,
        columns: columns.length,
        cards: cards.length,
      })
    }
  )
}
