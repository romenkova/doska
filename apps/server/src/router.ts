import { contract, type MemberRole } from "@doska/contract"
import { implement, ORPCError } from "@orpc/server"
import {
  assertAdmin,
  countOwnedBoards,
  deleteAccount,
  findAccount,
  listSsoUserIds,
} from "./db/accounts"
import { assertBoardAccess, assertBoardOwner, boardAccess } from "./db/access"
import {
  listPublishedBoards,
  publicToken,
  publishBoard,
  unpublishBoard,
} from "./db/public"
import {
  boardSync,
  boardsListSync,
  listRoster,
  listSharedBoards,
  revokeAllMemberships,
  writeMembers,
} from "./db/sync"
import { listUsers } from "./db/users"

const os = implement(contract).$context<{ userId: string }>()

/**
 * The board's own owner never gets a membership row
 */
async function refuseOwner(userId: string, boardId: string): Promise<void> {
  if ((await boardAccess(userId, boardId)) === "owner")
    throw new ORPCError("BAD_REQUEST", {
      message: "The board's owner already has access.",
    })
}

/**
 * What `userId` may do with the roster of `boardId`. A board this server has
 * never seen is the caller's own — they are about to push it — so it reads as
 * owner rather than as a board someone is prying at.
 */
async function rosterRole(
  userId: string,
  boardId: string
): Promise<MemberRole> {
  const access = await boardAccess(userId, boardId)
  if (access === "denied") throw new ORPCError("FORBIDDEN")
  return access === "member" ? "editor" : "owner"
}

export const router = os.router({
  board: {
    sync: os.board.sync.handler(async ({ input, context }) => {
      await boardSync.applyPush(input.boardId, input.changes, context.userId)
      return boardSync.readSince(input.boardId, input.since, context.userId)
    }),
  },
  dashboards: {
    sync: os.dashboards.sync.handler(async ({ input, context }) => {
      await boardsListSync.applyPush(input.changes, context.userId)
      return boardsListSync.readSince(input.since, context.userId)
    }),
  },
  boards: {
    publish: os.boards.publish.handler(async ({ input, context }) => {
      await assertBoardOwner(context.userId, input.boardId)
      return { token: await publishBoard(input.boardId) }
    }),
    unpublish: os.boards.unpublish.handler(async ({ input, context }) => {
      await assertBoardOwner(context.userId, input.boardId)
      await unpublishBoard(input.boardId)
    }),
    publicStatus: os.boards.publicStatus.handler(async ({ input, context }) => {
      await assertBoardAccess(context.userId, input.boardId)
      return { token: await publicToken(input.boardId) }
    }),
    published: os.boards.published.handler(async ({ context }) => ({
      boardIds: await listPublishedBoards(context.userId),
    })),
  },
  members: {
    list: os.members.list.handler(async ({ input, context }) => {
      const viewerRole = await rosterRole(context.userId, input.boardId)
      return { members: await listRoster(input.boardId), viewerRole }
    }),
    sharedBoards: os.members.sharedBoards.handler(async ({ context }) => ({
      boardIds: await listSharedBoards(context.userId),
    })),
    add: os.members.add.handler(async ({ input, context }) => {
      await assertBoardOwner(context.userId, input.boardId)
      await refuseOwner(input.userId, input.boardId)
      await writeMembers([
        { boardId: input.boardId, userId: input.userId, role: input.role },
      ])
    }),
    remove: os.members.remove.handler(async ({ input, context }) => {
      if (input.userId === context.userId) {
        // Leaving. Only a member has access to give up: an owner doing this
        // would be abandoning their own board, which is a delete.
        const access = await boardAccess(context.userId, input.boardId)
        if (access === "denied") throw new ORPCError("FORBIDDEN")
        if (access !== "member")
          throw new ORPCError("BAD_REQUEST", {
            message: "A board's owner cannot leave it.",
          })
      } else {
        await assertBoardOwner(context.userId, input.boardId)
        await refuseOwner(input.userId, input.boardId)
      }
      const now = Date.now()
      await writeMembers(
        [{ boardId: input.boardId, userId: input.userId, revokedAt: now }],
        now
      )
    }),
  },
  users: {
    list: os.users.list.handler(async () => ({ users: await listUsers() })),
  },
  accounts: {
    ownedBoards: os.accounts.ownedBoards.handler(async ({ input, context }) => {
      await assertAdmin(context.userId)
      return { boards: await countOwnedBoards(input.userId) }
    }),
    remove: os.accounts.remove.handler(async ({ input, context }) => {
      await assertAdmin(context.userId)
      if (input.userId === context.userId)
        throw new ORPCError("BAD_REQUEST", {
          message: "An account cannot delete itself.",
        })

      const target = await findAccount(input.userId)
      if (!target) throw new ORPCError("NOT_FOUND")
      if (target.active)
        throw new ORPCError("BAD_REQUEST", {
          message: "Deactivate the account before deleting it.",
        })

      const boards = await countOwnedBoards(input.userId)
      if (boards > 0)
        throw new ORPCError("BAD_REQUEST", {
          message: `This account still owns ${boards} board${boards === 1 ? "" : "s"}. Move or delete them first.`,
        })

      await revokeAllMemberships(input.userId)
      await deleteAccount(input.userId)
    }),
    sso: os.accounts.sso.handler(async ({ context }) => {
      await assertAdmin(context.userId)
      return { userIds: await listSsoUserIds() }
    }),
  },
})
