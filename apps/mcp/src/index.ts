import { createBoardServer } from "@doska/mcp"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { SyncStore } from "./store"
import pkg from "../package.json" with { type: "json" }

// One process serves one client, so one store — and its cursors live as long as
// the connection does.
const server = createBoardServer(new SyncStore(), pkg.version)

// stdio is the transport, diagnostics go to stderr.
await server.connect(new StdioServerTransport())
