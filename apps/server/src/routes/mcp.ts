import { createBoardServer } from "@doska/mcp"
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js"
import type { FastifyInstance } from "fastify"
import { DbStore } from "../mcp/store"
import pkg from "../../package.json" with { type: "json" }

/**
 * The board over MCP, at `/mcp` — what a remote MCP client (Claude Code,
 * Claude Desktop, claude.ai) connects to.
 */
export function registerMcpRoutes(app: FastifyInstance): void {
  app.all("/mcp", async (req, reply) => {
    // Stateless: a server and transport per request, so nothing is pinned to a
    // session and a restart or a second replica costs a client nothing.
    const server = createBoardServer(new DbStore(), pkg.version)
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    })
    reply.raw.on("close", () => {
      void transport.close()
      void server.close()
    })

    await server.connect(transport)
    // The body is still on the raw stream — the JSON parser in index.ts is a
    // no-op — so the transport reads and parses it itself.
    await transport.handleRequest(req.raw, reply.raw)
    return reply.hijack()
  })
}
