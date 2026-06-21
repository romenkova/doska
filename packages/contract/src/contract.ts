import { oc } from "@orpc/contract";
import { z } from "zod";
import { ChangeSchema, DashboardChangeSchema } from "./schemas";

/**
 * The sync contract. Two channels, each push-then-pull with a `since` cursor:
 *
 *  - `board.sync`: a single board's columns and cards, scoped by `boardId`.
 *  - `dashboards.sync`: the dashboard list, account-level and board-independent,
 *    so other boards' create/rename/delete reach a client whatever board is open.
 *
 * In both: push the client's locally-changed records in `changes`; pull every
 * record changed past the client's `since` cursor, plus the new high-water `cursor`.
 */
export const contract = {
  board: {
    sync: oc
      .input(
        z.object({
          boardId: z.string(),
          since: z.number(),
          changes: z.array(ChangeSchema),
        }),
      )
      .output(
        z.object({
          cursor: z.number(),
          changes: z.array(ChangeSchema),
        }),
      ),
  },
  dashboards: {
    sync: oc
      .input(
        z.object({
          since: z.number(),
          changes: z.array(DashboardChangeSchema),
        }),
      )
      .output(
        z.object({
          cursor: z.number(),
          changes: z.array(DashboardChangeSchema),
        }),
      ),
  },
};
