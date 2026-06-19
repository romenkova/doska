import { oc } from "@orpc/contract";
import { z } from "zod";
import { ChangeSchema } from "./schemas";

/**
 * The sync contract.
 *
 *  - push: the client's locally-changed records in `changes`.
 *  - pull: every record the board has seen past the client's `since` cursor,
 *    returned in `changes`, plus the new high-water `cursor`.
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
};
