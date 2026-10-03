import { fetchSession, onSessionExpired, SIGNED_OUT } from "./api/auth"
import { seed } from "./api/db/db"
import { migrateUserKey, reconcileIdentity } from "./api/identity"
import { purgeExpired } from "./api/operations"
import { seedClock, startBackgroundSync, sync } from "./api/sync"
import { keys } from "./data/keys"
import { queryClient } from "./query-client"

/**
 * What has to have happened before anything reads or writes a record. Call it
 * once, after the runtime is installed and before the first render that touches
 * data.
 *
 * `syncIntervalMs` is how a host ticks faster than the production cadence; it
 * reads it from its own build config.
 */
export async function bootstrapClient(syncIntervalMs?: number): Promise<void> {
  sync.init()

  onSessionExpired(() => {
    queryClient.setQueryData(keys.session, SIGNED_OUT)
  })

  // Restore the high-water mark before any stamp is issued, or a local edit can
  // be timestamped below one already handed out and lose LWW silently.
  await seedClock()

  // Before the session, and so before any sign-in can move the server URL out
  // from under the id this stamps.
  await migrateUserKey()

  // Whose data is on this device, settled before the first reconcile can run
  const session = await fetchSession().catch(() => null)
  if (session) queryClient.setQueryData(keys.session, session)
  await reconcileIdentity(session?.userId ?? null)

  // Below `seedClock` and not above it: this reconciles once before it returns,
  // which is already too late to restore the clock.
  startBackgroundSync(syncIntervalMs)

  await seed()

  // Empty the trash of anything past its 14 days. Not awaited: nothing rendered
  // reads tombstones, and the trash view sweeps again when it opens.
  void purgeExpired()
}
