import { contract } from "@deck/contract"
import { implement } from "@orpc/server"
import {
  applyDashboardPush,
  applyPush,
  readDashboardsSince,
  readSince,
} from "./db/sync"

const os = implement(contract)

export const router = os.router({
  board: {
    sync: os.board.sync.handler(async ({ input }) => {
      await applyPush(input.boardId, input.changes)
      return readSince(input.boardId, input.since)
    }),
  },
  dashboards: {
    sync: os.dashboards.sync.handler(async ({ input }) => {
      await applyDashboardPush(input.changes)
      return readDashboardsSince(input.since)
    }),
  },
})
