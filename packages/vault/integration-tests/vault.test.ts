import {
  mkdtemp,
  readFile,
  readdir,
  rename,
  rm,
  writeFile,
} from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { deleteForever } from "@doska/core"
import { Vault } from "../src/vault"
import { BOARD_ID, installBoard, makeColumn, type TestBoard } from "./board"
import { nodeFs } from "./node-fs"

const TODO = makeColumn("col-todo", "To do", "a0")
const DONE = makeColumn("col-done", "Done", "a1")

/** A real folder on disk, with the real board operations above it. */
describe("Vault on disk", () => {
  let root: string
  let board: TestBoard
  let vault: Vault
  let changes: number

  const path = (...parts: string[]) => join(root, ...parts)
  const read = (...parts: string[]) => readFile(path(...parts), "utf8")
  const names = (...parts: string[]) => readdir(path(...parts))

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), "vault-"))
    board = await installBoard([TODO, DONE])
    changes = 0
    vault = new Vault({
      fs: nodeFs(),
      board,
      boardId: BOARD_ID,
      root,
      onBoardChange: () => changes++,
    })
  })

  afterEach(async () => {
    await rm(root, { recursive: true, force: true })
  })

  it("lays the board out as folders and files", async () => {
    const id = await board.createCard(TODO.id)
    await board.updateCard(id, { title: "Ship it", body: "soon" })
    await vault.sync()

    expect((await names()).sort()).toEqual([
      "_meta.json",
      "_trash",
      "done",
      "to_do",
    ])
    expect(await read("to_do", "ship_it.md")).toBe(
      `---\nid: ${id}\ntitle: Ship it\n---\nsoon\n`
    )
  })

  it("takes an edit made in the folder back into the board", async () => {
    const id = await board.createCard(TODO.id)
    await board.updateCard(id, { title: "Ship it" })
    await vault.sync()

    await writeFile(
      path("to_do", "ship_it.md"),
      `---\nid: ${id}\ntitle: Ship it later\ndeadline: 2026-09-01\npriority: high\n---\nfrom the editor\n`,
      "utf8"
    )
    await vault.sync()

    const card = (await board.cards()).find((c) => c.id === id)
    expect(card?.title).toBe("Ship it later")
    expect(card?.body).toBe("from the editor")
    expect(card?.deadline).toBe("2026-09-01")
    expect(card?.priority).toBe("high")
    expect(changes).toBe(1)

    // The file is the one that changed, so it keeps the name it has: only a
    // retitle in the app renames.
    await vault.sync()
    expect(await names("to_do")).toEqual(["ship_it.md"])

    await board.updateCard(id, { title: "Ship it sooner" })
    await vault.sync()
    expect(await names("to_do")).toEqual(["ship_it_sooner.md"])
  })

  it("makes a card out of a note dropped into a column folder", async () => {
    await vault.sync()
    await writeFile(path("to_do", "Buy milk.md"), "two litres\n", "utf8")
    await vault.sync()

    const [card] = await board.cards()
    expect(card.title).toBe("Buy milk")
    expect(card.body).toBe("two litres")
    expect(card.columnId).toBe(TODO.id)
    expect(await read("to_do", "Buy milk.md")).toContain(`id: ${card.id}`)
  })

  it("moves the card when its file is dragged between folders", async () => {
    const id = await board.createCard(TODO.id)
    await board.updateCard(id, { title: "Ship it" })
    await vault.sync()

    await rename(path("to_do", "ship_it.md"), path("done", "ship_it.md"))
    await vault.sync()

    expect((await board.cards()).find((c) => c.id === id)?.columnId).toBe(
      DONE.id
    )
  })

  it("moves the file when the card is moved on the board", async () => {
    const id = await board.createCard(TODO.id)
    await board.updateCard(id, { title: "Ship it" })
    await vault.sync()

    await board.moveCardToColumn(id, DONE.id)
    await vault.sync()

    expect(await names("to_do")).toEqual([])
    expect(await names("done")).toEqual(["ship_it.md"])
  })

  it("deletes the card whose file is dragged into _trash, and brings it back", async () => {
    const id = await board.createCard(TODO.id)
    await board.updateCard(id, { title: "Ship it" })
    await vault.sync()

    await rename(path("to_do", "ship_it.md"), path("_trash", "ship_it.md"))
    await vault.sync()
    expect(await board.cards()).toEqual([])

    await rename(path("_trash", "ship_it.md"), path("done", "ship_it.md"))
    await vault.sync()

    const [card] = await board.cards()
    expect(card.id).toBe(id)
    expect(card.columnId).toBe(DONE.id)
  })

  it("trashes the file of a card deleted on the board, and writes it back on restore", async () => {
    const id = await board.createCard(TODO.id)
    await board.updateCard(id, { title: "Ship it", body: "soon" })
    await vault.sync()

    await board.deleteCard(id)
    await vault.sync()
    expect(await names("to_do")).toEqual([])
    expect(await names("_trash")).toEqual(["ship_it.md"])

    await board.restoreCard(id)
    await vault.sync()
    expect(await names("_trash")).toEqual([])
    expect(await read("to_do", "ship_it.md")).toContain("soon")

    // And it stays put, rather than reading as a file dragged to the trash.
    await vault.sync()
    expect((await board.cards()).map((c) => c.id)).toEqual([id])
  })

  it("drops the trash copy of a card deleted forever", async () => {
    const id = await board.createCard(TODO.id)
    await board.updateCard(id, { title: "Ship it" })
    await vault.sync()
    await board.deleteCard(id)
    await vault.sync()
    expect(await names("_trash")).toEqual(["ship_it.md"])

    await deleteForever("cards", id)
    await vault.sync()

    expect(await names("_trash")).toEqual([])
  })

  it("survives a restart, remembering what it wrote", async () => {
    const id = await board.createCard(TODO.id)
    await board.updateCard(id, { title: "Ship it" })
    await vault.sync()

    await rm(path("to_do", "ship_it.md"))
    // A fresh vault knows only `_meta.json`, which is where the deletion shows.
    await new Vault({ fs: nodeFs(), board, boardId: BOARD_ID, root }).sync()

    expect(await board.cards()).toEqual([])
    expect(await names("_trash")).toEqual(["ship_it.md"])
  })

  it("renames the folder when the column is renamed on the board", async () => {
    const id = await board.createCard(TODO.id)
    await board.updateCard(id, { title: "Ship it" })
    await vault.sync()

    await board.renameColumn(TODO.id, "Later")
    await vault.sync()

    expect((await names()).sort()).toEqual([
      "_meta.json",
      "_trash",
      "done",
      "later",
    ])
    expect(await read("later", "ship_it.md")).toContain(`id: ${id}`)
    expect(await board.cards()).toHaveLength(1)
  })

  it("renames the column when the folder is renamed on disk", async () => {
    const id = await board.createCard(TODO.id)
    await board.updateCard(id, { title: "Ship it" })
    await vault.sync()

    await rename(path("to_do"), path("Later"))
    await vault.sync()

    const { columns } = await board.load()
    expect(columns.find((column) => column.id === TODO.id)?.title).toBe("Later")
    expect(await names("Later")).toEqual(["ship_it.md"])
    expect((await board.cards())[0]?.columnId).toBe(TODO.id)
    expect(changes).toBe(1)
  })

  it("settles: a second pass over an untouched folder writes nothing", async () => {
    const id = await board.createCard(TODO.id)
    await board.updateCard(id, { title: "Ship it", body: "soon" })
    await vault.sync()
    const before = await read("to_do", "ship_it.md")
    const meta = await read("_meta.json")

    await vault.sync()
    await vault.sync()

    expect(await read("to_do", "ship_it.md")).toBe(before)
    expect(await read("_meta.json")).toBe(meta)
    expect(changes).toBe(0)
  })

  it("mirrors a whole board of cards in one pass", async () => {
    for (const title of ["One", "Two", "Three"]) {
      const id = await board.createCard(TODO.id)
      await board.updateCard(id, { title })
    }
    const done = await board.createCard(DONE.id)
    await board.updateCard(done, { title: "Four" })
    await vault.sync()

    expect((await names("to_do")).sort()).toEqual([
      "one.md",
      "three.md",
      "two.md",
    ])
    expect(await names("done")).toEqual(["four.md"])
  })

  it("picks up a change through the watcher", async () => {
    const stop = await vault.watch()
    try {
      await writeFile(path("to_do", "Idea.md"), "a thought\n", "utf8")
      await expect
        .poll(async () => (await board.cards()).length, { timeout: 5000 })
        .toBe(1)
    } finally {
      stop()
    }
  })
})
