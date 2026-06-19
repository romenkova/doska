import { contract } from "@deck/contract"
import { implement } from "@orpc/server"
import { applyPush, readSince } from "./db/sync"

const os = implement(contract)

export const router = os.router({
  board: {
    sync: os.board.sync.handler(({ input }) => {
      applyPush(input.boardId, input.changes)
      return readSince(input.boardId, input.since)
    }),
  },
})
