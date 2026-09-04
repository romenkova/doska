import { beforeEach, describe, expect, it } from "vitest"
import type { Runtime } from "../src/runtime"
import { installRuntime } from "../src/runtime"
import { SIDEBAR, SIDEBAR_LAYOUT_ID } from "../src/api/constants"
import type { SidebarItem, SidebarLayout } from "../src/types"

const rows = new Map<string, unknown>()

const db = {
  get: (store: string, key: string) =>
    Promise.resolve(rows.get(`${store}/${key}`)),
  set: (store: string, key: string, value: unknown) => {
    rows.set(`${store}/${key}`, value)
    return Promise.resolve()
  },
}

const kvStore = new Map<string, string>()
const kv = {
  get: (key: string) => kvStore.get(key) ?? null,
  set: (key: string, value: string) => void kvStore.set(key, value),
  remove: (key: string) => void kvStore.delete(key),
}

function seed(items: SidebarItem[]) {
  rows.set(`${SIDEBAR}/${SIDEBAR_LAYOUT_ID}`, {
    id: SIDEBAR_LAYOUT_ID,
    items,
    updatedAt: 1,
    deletedAt: null,
  })
}

const layoutItems = () =>
  (rows.get(`${SIDEBAR}/${SIDEBAR_LAYOUT_ID}`) as SidebarLayout).items

beforeEach(() => {
  rows.clear()
  kvStore.clear()
  installRuntime({ db, kv } as unknown as Runtime)
})

describe("renameFolder", () => {
  it("changes only that folder's title", async () => {
    seed([
      {
        type: "folder",
        id: "f1",
        title: "Old",
        collapsed: false,
        boardIds: [],
      },
      {
        type: "folder",
        id: "f2",
        title: "Other",
        collapsed: true,
        boardIds: ["b"],
      },
    ])
    const { renameFolder } =
      await import("../src/api/operations/sidebar-layout")
    await renameFolder("f1", "New")

    expect(layoutItems()).toEqual([
      {
        type: "folder",
        id: "f1",
        title: "New",
        collapsed: false,
        boardIds: [],
      },
      {
        type: "folder",
        id: "f2",
        title: "Other",
        collapsed: true,
        boardIds: ["b"],
      },
    ])
  })
})

describe("deleteFolder", () => {
  it("drops the folder and leaves its boards at its spot in the root", async () => {
    seed([
      { type: "board", id: "a" },
      {
        type: "folder",
        id: "f1",
        title: "F",
        collapsed: false,
        boardIds: ["b", "c"],
      },
      { type: "board", id: "d" },
    ])
    const { deleteFolder } =
      await import("../src/api/operations/sidebar-layout")
    await deleteFolder("f1")

    expect(layoutItems()).toEqual([
      { type: "board", id: "a" },
      { type: "board", id: "b" },
      { type: "board", id: "c" },
      { type: "board", id: "d" },
    ])
  })
})
