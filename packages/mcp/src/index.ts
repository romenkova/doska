import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { createBoard } from "./board"
import { registerBoardTools } from "./tools/boards"
import { registerCardTools } from "./tools/cards"
import { registerColumnTools } from "./tools/columns"
import type { BoardStore } from "./store"

export type { BoardStore } from "./store"

export function createBoardServer(
  store: BoardStore,
  version: string
): McpServer {
  const server = new McpServer({ name: "doska", version })
  const board = createBoard(store)

  registerBoardTools(server, board)
  registerColumnTools(server, board)
  registerCardTools(server, board)
  return server
}
