import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { registerBoardTools } from "./tools/boards"
import { registerCardTools } from "./tools/cards"
import { registerColumnTools } from "./tools/columns"
import pkg from "../package.json" with { type: "json" }

/**
 * An MCP server over Doska's boards. It is a sync client like any other: it
 * reads and writes through the server's sync API, so its edits reach the web
 * and desktop apps on their next sync. It needs a running Doska server —
 * offline, browser-only boards live in IndexedDB and are not reachable here.
 */

const server = new McpServer({ name: "doska", version: pkg.version })

registerBoardTools(server)
registerColumnTools(server)
registerCardTools(server)

// stdio is the transport, so anything written to stdout would corrupt the
// protocol stream — diagnostics go to stderr.
await server.connect(new StdioServerTransport())
