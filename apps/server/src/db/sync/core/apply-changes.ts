import { db } from "../../client"
import type { SeqCounter, Tx } from "./counter"

/**
 * Drives a channel's push: in one transaction, reads the channel's counter,
 * applies each change with `apply` (which returns whether it wrote), bumps the
 * counter once per accepted write, and persists it. The single transaction
 * keeps the counter and the rows it stamps from drifting apart.
 */
export async function applyChanges<C>(
  counter: SeqCounter,
  changes: C[],
  apply: (tx: Tx, change: C, nextSeq: number) => Promise<boolean>
): Promise<void> {
  if (changes.length === 0) return

  await db.transaction(async (tx) => {
    let seq = await counter.ensure(tx)
    for (const change of changes) {
      if (await apply(tx, change, seq + 1)) seq += 1
    }
    await counter.write(tx, seq)
  })
}
