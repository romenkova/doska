import { contract } from "@doska/contract"
import { implement } from "@orpc/server"
import { boardSync, boardsListSync } from "./db/sync"

const os = implement(contract)

export const router = os.router({
  board: {
    sync: os.board.sync.handler(async ({ input }) => {
      await boardSync.applyPush(input.boardId, input.changes)
      return boardSync.readSince(input.boardId, input.since)
    }),
  },
  dashboards: {
    sync: os.dashboards.sync.handler(async ({ input }) => {
      await boardsListSync.applyPush(input.changes)
      return boardsListSync.readSince(input.since)
    }),
  },
})
