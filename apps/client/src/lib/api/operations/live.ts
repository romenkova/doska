/** A record is live until it's tombstoned (see `deletedAt` in the contract). */
export const live = <T extends { deletedAt: number | null }>(r: T) =>
  r.deletedAt === null
