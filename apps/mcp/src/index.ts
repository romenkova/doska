import { createBoardServer } from "@doska/mcp"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { syncStore } from "./store"
import pkg from "../package.json" with { type: "json" }

const server = createBoardServer(syncStore, pkg.version)

// stdio is the transport, diagnostics go to stderr.
await server.connect(new StdioServerTransport())
