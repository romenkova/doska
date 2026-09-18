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
    const server = createBoardServer(
      new DbStore(req.userId),
      pkg.version,
      (tool, error) => {
        req.log.error({ err: error, tool, userId: req.userId }, "mcp: failed")
      }
    )
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    })
    reply.raw.on("close", () => {
      void transport.close()
      void server.close()
    })

    await server.connect(transport)
    await transport.handleRequest(req.raw, reply.raw)
    return reply.hijack()
  })
}
