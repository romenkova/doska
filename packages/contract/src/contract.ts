import { oc } from "@orpc/contract"
import { z } from "zod"
import {
  ChangeSchema,
  DashboardChangeSchema,
  DirectoryUserSchema,
  MemberRoleSchema,
  MemberSchema,
} from "./schemas"

/**
 * The sync contract. Two channels, each push-then-pull with a `since` cursor:
 *
 *  - `board.sync`: a single board's columns and cards, scoped by `boardId`.
 *  - `dashboards.sync`: the dashboard list, account-level and board-independent,
 *    so other boards' create/rename/delete reach a client whatever board is open.
 *
 * In both: push the client's locally-changed records in `changes`; pull every
 * record changed past the client's `since` cursor, plus the new high-water `cursor`.
 *
 * `members` and `users` are not channels. They are ordinary request/response
 * RPCs with no cursor: a membership write shows up on a client through the
 * `dashboards.sync` channel, which is why the row carries a board-list `seq`.
 */
export const contract = {
  board: {
    sync: oc
      .input(
        z.object({
          boardId: z.string(),
          since: z.number(),
          changes: z.array(ChangeSchema),
        })
      )
      .output(
        z.object({
          cursor: z.number(),
          changes: z.array(ChangeSchema),
        })
      ),
  },
  dashboards: {
    sync: oc
      .input(
        z.object({
          since: z.number(),
          changes: z.array(DashboardChangeSchema),
        })
      )
      .output(
        z.object({
          cursor: z.number(),
          changes: z.array(DashboardChangeSchema),
          // Boards this account has lost access to
          removed: z.array(z.string()).optional(),
        })
      ),
  },
  boards: {
    /**
     * The public share link, which is a different mechanism from `members`:
     * `members` shares with accounts on this deploy, this shares with anyone at
     * all, read-only and with no sign-in.
     *
     * The token lives only here — it is deliberately not on the dashboard
     * record, so no client push can carry it (see `dashboards.public_token`).
     */
    publish: oc
      .input(z.object({ boardId: z.string() }))
      .output(z.object({ token: z.string() })),
    unpublish: oc.input(z.object({ boardId: z.string() })).output(z.void()),
    publicStatus: oc
      .input(z.object({ boardId: z.string() }))
      .output(z.object({ token: z.string().nullable() })),
    /** Which of the caller's boards are published, for the list's marker. */
    published: oc.output(z.object({ boardIds: z.array(z.string()) })),
  },
  members: {
    /** Readable by anyone on the board; `viewerRole` is what the caller may do,
     * so the UI never offers an action the handlers below would refuse. */
    list: oc.input(z.object({ boardId: z.string() })).output(
      z.object({
        members: z.array(MemberSchema),
        viewerRole: MemberRoleSchema,
      })
    ),
    /** Board ids the session shares — owned and given away, or given to it.
     * Sharing is not on the dashboard record, so the sidebar asks separately. */
    sharedBoards: oc.output(z.object({ boardIds: z.array(z.string()) })),
    add: oc
      .input(
        z.object({
          boardId: z.string(),
          userId: z.string(),
          role: MemberRoleSchema.default("editor"),
        })
      )
      .output(z.void()),
    /** Owner-only, except that a member may pass their own id to leave. */
    remove: oc
      .input(z.object({ boardId: z.string(), userId: z.string() }))
      .output(z.void()),
  },
  users: {
    list: oc.output(z.object({ users: z.array(DirectoryUserSchema) })),
  },
  accounts: {
    ownedBoards: oc
      .input(z.object({ userId: z.string() }))
      .output(z.object({ boards: z.number() })),
    /**
     * Deletes an account. Admin-only, and refused unless the account
     * is already deactivated and owns no live board
     */
    remove: oc.input(z.object({ userId: z.string() })).output(z.void()),
    /** Accounts with an identity-provider sign-in. Admin-only. */
    sso: oc.output(z.object({ userIds: z.array(z.string()) })),
  },
}
