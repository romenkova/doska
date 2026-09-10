import { beforeEach, describe, expect, it, vi } from "vitest"
import type { KeyValue } from "@doska/ports"
import { DirtyStore } from "../src/dirty"
import type { PushInput, PushResult, SyncDriver } from "../src/driver"
import { SyncEngine, type SyncFailure } from "../src/engine"

/** A change is just the ref it occupies; enough to drive the engine. */
type Change = { ref: string }

/** Refs are `scope/id`, so a ref's scope is readable without a store. */
class FakeDriver implements SyncDriver<string, Change> {
  readonly pushes: PushInput<string, Change>[] = []

  push: (input: PushInput<string, Change>) => Promise<PushResult<Change>> = (
    input
  ) => {
    this.pushes.push(input)
    return Promise.resolve({ cursor: 1, changes: [] })
  }

  get pushedScopes(): string[] {
    return this.pushes.map((p) => p.scope)
  }

  record(input: PushInput<string, Change>) {
    this.pushes.push(input)
  }

  loadCursor = () => Promise.resolve(0)
  saveCursor = () => Promise.resolve()

  collectChanges(scope: string, dirty: DirtyStore) {
    const refs = [...dirty.all()].filter((ref) => ref.startsWith(`${scope}/`))
    return Promise.resolve({ changes: refs.map((ref) => ({ ref })), refs })
  }

  pendingScopes(dirty: DirtyStore) {
    const scopes = new Set<string>()
    for (const ref of dirty.all()) scopes.add(ref.split("/")[0])
    return Promise.resolve([...scopes])
  }

  applyRemote = () => Promise.resolve()
  applyRemoved?: (removed: string[]) => Promise<void>
  refOf = (change: Change) => change.ref
  compact = () => Promise.resolve()
}

/** A promise that never settles — a fetch killed when the OS suspends the app. */
const forever = <T>(): Promise<T> => new Promise<T>(() => {})

let keySeq = 0
const freshKey = () => `test:dirty:${keySeq++}`

/** The persistence a reload survives, without a browser under it. */
const stored = new Map<string, string>()

const kv: KeyValue = {
  get: (key) => stored.get(key) ?? null,
  set: (key, value) => void stored.set(key, value),
  remove: (key) => void stored.delete(key),
}

beforeEach(() => stored.clear())

describe("SyncEngine", () => {
  it("pushes an active scope's dirty refs and clears them on success", async () => {
    const driver = new FakeDriver()
    const engine = new SyncEngine(driver, { kv, storageKey: freshKey() })

    engine.setActiveScope("b1")
    engine.mark("b1/c1")
    await engine.reconcile()

    // Across all pushes, not the last: `setActiveScope` starts a cycle, so the
    // mark rides the first pass and the rerun pushes nothing.
    expect(driver.pushes.flatMap((p) => p.changes)).toEqual([{ ref: "b1/c1" }])
    expect(engine.getState().pending).toBe(0)
  })

  it("reports syncing for a push, not for a pull with nothing to send", async () => {
    const driver = new FakeDriver()
    const engine = new SyncEngine(driver, { kv, storageKey: freshKey() })
    const seen: string[] = []
    engine.subscribe(() => seen.push(engine.getState().status))

    engine.setActiveScope("b1")
    await engine.reconcile()
    expect(seen).not.toContain("syncing")

    engine.mark("b1/c1")
    await engine.reconcile()
    expect(seen).toContain("syncing")
  })

  it("forgets dirty refs on clearDirty, in memory and on disk", async () => {
    const driver = new FakeDriver()
    const key = freshKey()
    const engine = new SyncEngine(driver, { kv, storageKey: key })

    engine.mark("b1/c1")
    engine.clearDirty()

    expect(engine.getState().pending).toBe(0)
    expect([...new DirtyStore(kv, key).all()]).toEqual([])

    // Nothing left to find a scope from, so the reconcile pushes nothing.
    await engine.reconcile()
    expect(driver.pushes).toEqual([])
  })

  it("syncs nothing after a reset until it is pointed somewhere again", async () => {
    const driver = new FakeDriver()
    const engine = new SyncEngine(driver, { kv, storageKey: freshKey() })

    engine.setActiveScope("b1")
    engine.watchScopes(["b2"])
    engine.mark("b1/c1")
    await engine.reconcileScopes(["b3"])
    driver.pushes.length = 0

    engine.reset()
    await engine.reconcile()
    expect(driver.pushes).toEqual([])

    engine.setActiveScope("b9")
    await engine.reconcile()
    expect([...new Set(driver.pushedScopes)]).toEqual(["b9"])
  })

  it("restores dirty refs when the push rejects", async () => {
    const driver = new FakeDriver()
    const key = freshKey()
    const engine = new SyncEngine(driver, { kv, storageKey: key })
    driver.push = () => Promise.reject(new Error("boom"))

    engine.setActiveScope("b1")
    engine.mark("b1/c1")
    await engine.reconcile()

    expect(engine.getState().status).toBe("error")
    expect([...new DirtyStore(kv, key).all()]).toEqual(["b1/c1"])
  })

  it("keeps dirty refs recoverable when the push never settles", async () => {
    const driver = new FakeDriver()
    const key = freshKey()
    const engine = new SyncEngine(driver, { kv, storageKey: key })
    driver.push = (input) => {
      driver.record(input)
      return forever()
    }

    engine.setActiveScope("b1")
    engine.mark("b1/c1")
    void engine.reconcile()
    await vi.waitUntil(() => driver.pushes.length > 0)

    // The process dies here. What a relaunch would read back:
    expect([...new DirtyStore(kv, key).all()]).toEqual(["b1/c1"])
  })

  it("keeps a ref marked again while its push was in flight", async () => {
    const driver = new FakeDriver()
    const engine = new SyncEngine(driver, { kv, storageKey: freshKey() })
    let release: (result: PushResult<Change>) => void = () => {}
    driver.push = (input) => {
      driver.record(input)
      return new Promise((resolve) => (release = resolve))
    }

    // No active scope: `pendingScopes` alone drives the cycle, so there is one
    // pass and the re-mark isn't swept up by a rerun.
    engine.mark("b1/c1")
    const done = engine.reconcile()
    await vi.waitUntil(() => driver.pushes.length > 0)

    engine.mark("b1/c1")
    release({ cursor: 1, changes: [] })
    await done

    expect(engine.getState().pending).toBe(1)
  })

  it("does not consume one-shot scopes while syncing is gated off", async () => {
    const driver = new FakeDriver()
    let allowed = false
    const engine = new SyncEngine(driver, {
      kv,
      storageKey: freshKey(),
      canSync: () => allowed,
    })

    await engine.reconcileScopes(["b1"])
    expect(driver.pushedScopes).toEqual([])
    expect(engine.getState().status).toBe("paused")

    allowed = true
    await engine.reconcile()

    expect(driver.pushedScopes).toEqual(["b1"])
  })

  it("consumes one-shot scopes once they have actually been pulled", async () => {
    const driver = new FakeDriver()
    const engine = new SyncEngine(driver, { kv, storageKey: freshKey() })

    await engine.reconcileScopes(["b1"])
    await engine.reconcile()

    expect(driver.pushedScopes).toEqual(["b1"])
  })

  it("pulls watched scopes on every pass until they are cleared", async () => {
    const driver = new FakeDriver()
    const engine = new SyncEngine(driver, { kv, storageKey: freshKey() })

    engine.watchScopes(["b1", "b2"])
    await engine.reconcile()
    await engine.reconcile()

    expect(driver.pushedScopes).toEqual(["b1", "b2", "b1", "b2"])

    engine.watchScopes([])
    await engine.reconcile()

    expect(driver.pushedScopes).toEqual(["b1", "b2", "b1", "b2"])
  })
})

/** A refused scope: `classify` says so, and the engine must stop asking. */
describe("a forbidden scope", () => {
  const forbidden = new Error("403")

  /** Rejects `refused`; every other scope syncs normally. Returns the scopes tried. */
  function refusing(driver: FakeDriver, refused: string): string[] {
    const tried: string[] = []
    const ok = driver.push
    driver.push = (input) => {
      tried.push(input.scope)
      return input.scope === refused
        ? Promise.reject(forbidden)
        : (ok.call(driver, input) as Promise<PushResult<Change>>)
    }
    return tried
  }

  const options = (storageKey: string, dropped: string[]) => ({
    kv,
    storageKey,
    classify: (err: unknown): SyncFailure =>
      err === forbidden ? "forbidden" : "server",
    onForbidden: (scope: string) => void dropped.push(scope),
  })

  it("is dropped, reported to the owner, and never asked for again", async () => {
    const driver = new FakeDriver()
    const dropped: string[] = []
    const engine = new SyncEngine(driver, options(freshKey(), dropped))
    const tried = refusing(driver, "b1")

    engine.setActiveScope("b1")
    await engine.reconcile()
    expect(dropped).toEqual(["b1"])

    await engine.reconcile()
    expect(tried).toEqual(["b1"])
  })

  it("leaves the connection healthy and the other scopes syncing", async () => {
    const driver = new FakeDriver()
    const dropped: string[] = []
    const engine = new SyncEngine(driver, options(freshKey(), dropped))
    const tried = refusing(driver, "b1")

    engine.setActiveScope("b1")
    engine.watchScopes(["b1", "b2"])
    await engine.reconcile()

    // Not "error": the session is fine, one board simply isn't ours.
    expect(engine.getState().status).toBe("idle")
    expect(engine.getState().failures).toBe(0)
    expect(engine.getState().failure).toBeNull()

    await engine.reconcile()
    expect(tried.filter((scope) => scope === "b2").length).toBe(2)
  })

  it("claims no fresh success when it was the only scope in the pass", async () => {
    const driver = new FakeDriver()
    const dropped: string[] = []
    const engine = new SyncEngine(driver, options(freshKey(), dropped))
    refusing(driver, "b1")

    engine.setActiveScope("b1")
    await engine.reconcile()

    expect(engine.getState().lastSyncedAt).toBeNull()
  })

  it("stops retrying refs the server will keep refusing", async () => {
    const driver = new FakeDriver()
    const dropped: string[] = []
    const key = freshKey()
    const engine = new SyncEngine(driver, {
      ...options(key, dropped),
      // What `dropBoardLocally` does for real: the refs go with the scope.
      onForbidden: (scope: string) => {
        dropped.push(scope)
        engine.dropDirty(
          [...engine.dirty.all()].filter((ref) => ref.startsWith(`${scope}/`))
        )
      },
    })
    refusing(driver, "b1")

    engine.mark("b1/c1")
    engine.mark("b2/c1")
    await engine.reconcile()

    expect(engine.getState().pending).toBe(0)
    expect([...new DirtyStore(kv, key).all()]).toEqual([])
  })
})

/**
 * The other way a scope goes away: not refused on its own channel, but withdrawn
 * by a reply on another one — access revoked while the client was reading it.
 */
describe("a removed scope", () => {
  /** Withdraws `gone` on the first push, then reports nothing more. */
  function withdrawing(driver: FakeDriver, gone: string): void {
    let sent = false
    driver.push = (input) => {
      driver.record(input)
      const removed = sent ? [] : [gone]
      sent = true
      return Promise.resolve({ cursor: 1, changes: [], removed })
    }
  }

  it("is handed to the driver, and the cycle stays a success", async () => {
    const driver = new FakeDriver()
    const removed: string[][] = []
    driver.applyRemoved = (ids) => {
      removed.push(ids)
      return Promise.resolve()
    }
    const engine = new SyncEngine(driver, { kv, storageKey: freshKey() })
    withdrawing(driver, "b1")

    engine.setActiveScope("list")
    await engine.reconcile()

    expect(removed).toEqual([["b1"]])
    expect(engine.getState().status).toBe("idle")
    expect(engine.getState().failure).toBeNull()
  })

  it("moves the cursor only once the removal has been applied", async () => {
    const driver = new FakeDriver()
    const order: string[] = []
    driver.applyRemoved = () => {
      order.push("removed")
      return Promise.resolve()
    }
    driver.saveCursor = () => {
      order.push("cursor")
      return Promise.resolve()
    }
    const engine = new SyncEngine(driver, { kv, storageKey: freshKey() })
    withdrawing(driver, "b1")

    engine.setActiveScope("list")
    await engine.reconcile()

    expect(order.slice(0, 2)).toEqual(["removed", "cursor"])
  })

  it("takes a driver that cannot be told at all", async () => {
    const driver = new FakeDriver()
    const engine = new SyncEngine(driver, { kv, storageKey: freshKey() })
    withdrawing(driver, "b1")

    engine.setActiveScope("list")
    await engine.reconcile()

    expect(engine.getState().status).toBe("idle")
  })

  it("stops being pulled once it is gone", async () => {
    const driver = new FakeDriver()
    const engine = new SyncEngine(driver, { kv, storageKey: freshKey() })
    driver.applyRemoved = (ids) => {
      for (const id of ids) engine.dropScope(id)
      return Promise.resolve()
    }
    withdrawing(driver, "b1")

    engine.setActiveScope("b1")
    engine.watchScopes(["b1", "b2"])
    await engine.reconcile()
    driver.pushes.length = 0

    await engine.reconcile()
    expect(driver.pushedScopes).toEqual(["b2"])
  })
})
