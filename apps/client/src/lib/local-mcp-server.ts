import { type BoardStore, createBoardServer } from "@doska/mcp"
import type {
  Change,
  Dashboard,
  DashboardChange,
  Member,
} from "@doska/contract"
import {
  clock,
  db,
  keys,
  listMembers,
  queryClient,
  stamp,
  sync,
} from "@doska/core"
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js"

/** The MCP tools' store for Local MCP: this device's own database. */
class LocalStore implements BoardStore {
  now(): number {
    return stamp()
  }

  async readDashboards(): Promise<Dashboard[]> {
    const dashboards = await db.getDashboards()
    for (const dashboard of dashboards) clock.receive(dashboard.updatedAt)
    return dashboards
  }

  async readBoard(boardId: string): Promise<Change[]> {
    const columns = (await db.getColumns()).filter(
      (column) => column.dashboardId === boardId
    )
    const changes: Change[] = []
    for (const column of columns) {
      changes.push({ store: "columns", record: column })
      for (const card of await db.getCards(column.id)) {
        changes.push({ store: "cards", record: card })
      }
    }
    for (const change of changes) clock.receive(change.record.updatedAt)
    return changes
  }

  async pushDashboards(changes: DashboardChange[]): Promise<void> {
    for (const change of changes) {
      if (change.store === "dashboards") {
        await db.setDashboard(change.record)
      } else {
        await db.setSidebarLayout(change.record)
      }
      sync.markDirty(change.store, change.record.id)
    }
    void queryClient.invalidateQueries({ queryKey: keys.dashboards })
    void queryClient.invalidateQueries({ queryKey: keys.digest })
  }

  async pushBoard(_boardId: string, changes: Change[]): Promise<void> {
    for (const change of changes) {
      if (change.store === "cards") {
        await db.setCard(change.record)
      } else if (change.store === "columns") {
        await db.setColumn(change.record)
      } else {
        await db.setDashboard(change.record)
      }
      sync.markDirty(change.store, change.record.id)
    }
    void queryClient.invalidateQueries({ queryKey: keys.boards })
    void queryClient.invalidateQueries({ queryKey: keys.cards })
    void queryClient.invalidateQueries({ queryKey: keys.cardCols })
    void queryClient.invalidateQueries({ queryKey: keys.digest })
  }

  // Signed out there is no server to ask, so nobody to assign.
  async readMembers(boardId: string): Promise<Member[]> {
    try {
      return (await listMembers(boardId)).members
    } catch {
      return []
    }
  }
}

export interface McpRequest {
  id: number
  method: string
  headers: [string, string][]
  body: string
}

export async function answer(
  request: McpRequest,
  version: string
): Promise<Response> {
  const server = createBoardServer(new LocalStore(), version)
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  })
  await server.connect(transport)
  try {
    return await transport.handleRequest(
      new Request("http://127.0.0.1/mcp", {
        method: request.method,
        headers: request.headers,
        body: request.method === "POST" ? request.body : undefined,
      })
    )
  } finally {
    void server.close()
  }
}
