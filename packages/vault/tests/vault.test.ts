import { beforeEach, describe, expect, it, vi } from "vitest"
import { Vault } from "../src/vault"
import { FakeBoard, FakeFiles, makeCard, makeColumn, MemoryFs } from "./fakes"

const ROOT = "/vault"
const BOARD = "board-1"
const TODO = makeColumn("col-todo", "To do")
const DONE = makeColumn("col-done", "Done")

describe("Vault", () => {
  let fs: MemoryFs
  let board: FakeBoard
  let vault: Vault
  let changes: number

  beforeEach(() => {
    fs = new MemoryFs()
    void fs.mkdir(ROOT)
    board = new FakeBoard([TODO, DONE])
    changes = 0
    vault = new Vault({
      fs,
      board,
      boardId: BOARD,
      root: ROOT,
      onBoardChange: () => changes++,
    })
  })

  it("writes each card into its column's folder", async () => {
    const card = board.add(
      makeCard({ columnId: TODO.id, title: "Ship it", body: "soon" })
    )
    await vault.sync()

    const text = fs.files.get(`${ROOT}/to_do/ship_it.md`)
    expect(text).toContain(`id: ${card.id}`)
    expect(text).toContain("soon")
    expect(changes).toBe(0)
  })

  it("keeps two cards with one title in separate files", async () => {
    board.add(makeCard({ columnId: TODO.id, title: "Ship it" }))
    board.add(makeCard({ columnId: TODO.id, title: "Ship it" }))
    await vault.sync()

    expect(fs.files.has(`${ROOT}/to_do/ship_it.md`)).toBe(true)
    expect(fs.files.has(`${ROOT}/to_do/ship_it_2.md`)).toBe(true)
  })

  it("takes an edit made in the file back into the card", async () => {
    const card = board.add(makeCard({ columnId: TODO.id, title: "Ship it" }))
    await vault.sync()

    const path = `${ROOT}/to_do/ship_it.md`
    await fs.write(path, `${fs.files.get(path)!}edited in the editor\n`)
    await vault.sync()

    expect(board.cardsById.get(card.id)?.body).toBe("edited in the editor")
    expect(changes).toBe(1)
  })

  it("writes an edit made in the app back out to the file", async () => {
    const card = board.add(makeCard({ columnId: TODO.id, title: "Ship it" }))
    await vault.sync()

    await board.updateCard(card.id, { body: "shipped" })
    await vault.sync()

    expect(fs.files.get(`${ROOT}/to_do/ship_it.md`)).toContain("shipped")
  })

  it("moves the card when its file is dragged to another folder", async () => {
    const card = board.add(makeCard({ columnId: TODO.id, title: "Ship it" }))
    await vault.sync()

    await fs.rename(`${ROOT}/to_do/ship_it.md`, `${ROOT}/done/ship_it.md`)
    await vault.sync()

    expect(board.cardsById.get(card.id)?.columnId).toBe(DONE.id)
    expect(changes).toBe(1)
  })

  it("lets the app move a card again after its file was dragged", async () => {
    const card = board.add(makeCard({ columnId: TODO.id, title: "Ship it" }))
    await vault.sync()

    await fs.rename(`${ROOT}/to_do/ship_it.md`, `${ROOT}/done/ship_it.md`)
    await vault.sync()

    await board.moveCardToColumn(card.id, TODO.id)
    await vault.sync()

    expect(board.cardsById.get(card.id)?.columnId).toBe(TODO.id)
    expect(fs.files.has(`${ROOT}/to_do/ship_it.md`)).toBe(true)
    expect(fs.files.has(`${ROOT}/done/ship_it.md`)).toBe(false)
  })

  it("moves the file when the card is dragged to another column", async () => {
    const card = board.add(makeCard({ columnId: TODO.id, title: "Ship it" }))
    await vault.sync()

    await board.moveCardToColumn(card.id, DONE.id)
    await vault.sync()

    expect(fs.files.has(`${ROOT}/to_do/ship_it.md`)).toBe(false)
    expect(fs.files.has(`${ROOT}/done/ship_it.md`)).toBe(true)
  })

  it("makes a card out of a note dropped into a folder", async () => {
    await vault.sync()
    await fs.write(`${ROOT}/to_do/Idea.md`, "a thought\n")
    await vault.sync()

    const card = [...board.cardsById.values()][0]
    expect(card.title).toBe("Idea")
    expect(card.body).toBe("a thought")
    expect(card.columnId).toBe(TODO.id)
    expect(fs.files.get(`${ROOT}/to_do/Idea.md`)).toContain(`id: ${card.id}`)
  })

  it("trashes the file of a card deleted in the app", async () => {
    const card = board.add(makeCard({ columnId: TODO.id, title: "Ship it" }))
    await vault.sync()

    await board.deleteCard(card.id)
    await vault.sync()

    expect(fs.files.has(`${ROOT}/to_do/ship_it.md`)).toBe(false)
    expect(fs.files.has(`${ROOT}/_trash/ship_it.md`)).toBe(true)
  })

  it("deletes the card whose file was dragged into _trash", async () => {
    const card = board.add(makeCard({ columnId: TODO.id, title: "Ship it" }))
    await vault.sync()

    await fs.rename(`${ROOT}/to_do/ship_it.md`, `${ROOT}/_trash/ship_it.md`)
    await vault.sync()

    expect(board.deleteCalls).toEqual([card.id])
    expect(changes).toBe(1)
  })

  it("lets the file win for edits made while the app was closed", async () => {
    const card = board.add(makeCard({ columnId: TODO.id, title: "Ship it" }))
    await vault.sync()

    const path = `${ROOT}/to_do/ship_it.md`
    const offline = `${fs.files.get(path)!}written while away\n`
    await fs.write(path, offline)

    // A restart: it reads back what it wrote from `_meta.json`, so the edit
    // reads as an edit and not as a whole new file.
    await new Vault({ fs, board, boardId: BOARD, root: ROOT }).sync()

    expect(board.cardsById.get(card.id)?.body).toBe("written while away")
  })

  it("keeps titles of any script readable in a filename", async () => {
    board.add(makeCard({ columnId: TODO.id, title: "Купить молоко" }))
    await vault.sync()

    expect(fs.files.has(`${ROOT}/to_do/купить_молоко.md`)).toBe(true)
  })

  it("keeps a trashed file's own name apart from one already there", async () => {
    const first = board.add(makeCard({ columnId: TODO.id, title: "Ship it" }))
    await vault.sync()
    await board.deleteCard(first.id)
    await vault.sync()

    const second = board.add(makeCard({ columnId: TODO.id, title: "Ship it" }))
    await vault.sync()
    await board.deleteCard(second.id)
    await vault.sync()

    expect(fs.files.has(`${ROOT}/_trash/ship_it.md`)).toBe(true)
    expect(fs.files.has(`${ROOT}/_trash/ship_it_2.md`)).toBe(true)
  })

  it("syncs again when the watcher fires", async () => {
    const stop = await vault.watch()

    await fs.write(`${ROOT}/to_do/Idea.md`, "a thought\n")
    fs.touch()

    await vi.waitFor(() => expect(board.cardsById.size).toBe(1))
    stop()
  })

  it("keeps watching when the first sync fails", async () => {
    const errors: unknown[] = []
    const failing = new Vault({
      fs,
      board: Object.assign(board, {
        load: () => Promise.reject(new Error("board is busy")),
      }),
      boardId: BOARD,
      root: ROOT,
      onError: (error) => errors.push(error),
    })

    const stop = await failing.watch()

    expect(errors).toHaveLength(1)
    stop()
  })

  it("trashes the card whose file was deleted", async () => {
    const card = board.add(makeCard({ columnId: TODO.id, title: "Ship it" }))
    await vault.sync()

    fs.files.delete(`${ROOT}/to_do/ship_it.md`)
    await vault.sync()

    expect(board.cardsById.has(card.id)).toBe(false)
    expect(fs.files.get(`${ROOT}/_trash/ship_it.md`)).toContain(
      `id: ${card.id}`
    )
    expect(changes).toBe(1)
  })

  it("leaves the board alone when the folder itself is gone", async () => {
    const card = board.add(makeCard({ columnId: TODO.id, title: "Ship it" }))
    await vault.sync()

    fs.wipe()
    await vault.sync()

    expect(board.cardsById.has(card.id)).toBe(true)
  })

  it("restores the files of a folder emptied all at once", async () => {
    const one = board.add(makeCard({ columnId: TODO.id, title: "Ship it" }))
    const two = board.add(makeCard({ columnId: TODO.id, title: "Ship more" }))
    await vault.sync()

    fs.files.delete(`${ROOT}/to_do/ship_it.md`)
    fs.files.delete(`${ROOT}/to_do/ship_more.md`)
    await vault.sync()

    expect(board.cardsById.has(one.id)).toBe(true)
    expect(board.cardsById.has(two.id)).toBe(true)
    expect(fs.files.has(`${ROOT}/to_do/ship_it.md`)).toBe(true)
    expect(fs.files.has(`${ROOT}/to_do/ship_more.md`)).toBe(true)
  })

  it("trashes the last card in a column when its file is deleted", async () => {
    const card = board.add(makeCard({ columnId: TODO.id, title: "Ship it" }))
    await vault.sync()

    fs.files.delete(`${ROOT}/to_do/ship_it.md`)
    await vault.sync()

    expect(board.cardsById.has(card.id)).toBe(false)
  })

  it("removes the folder of a column deleted in the app", async () => {
    const card = board.add(makeCard({ columnId: TODO.id, title: "Ship it" }))
    await vault.sync()

    board.deleteColumn(TODO.id)
    await vault.sync()

    expect(await fs.readDir(`${ROOT}/to_do`)).toBeNull()
    expect(fs.files.get(`${ROOT}/_trash/ship_it.md`)).toContain(
      `id: ${card.id}`
    )
  })

  it("keeps a deleted column's folder when it holds something else", async () => {
    board.add(makeCard({ columnId: TODO.id, title: "Ship it" }))
    await vault.sync()
    await fs.write(`${ROOT}/to_do/notes.txt`, "mine")

    board.deleteColumn(TODO.id)
    await vault.sync()

    expect(fs.files.get(`${ROOT}/to_do/notes.txt`)).toBe("mine")
  })

  it("does not hand a deleted column's folder to another column", async () => {
    board.add(makeCard({ columnId: TODO.id, title: "Ship it" }))
    await vault.sync()

    board.deleteColumn(DONE.id)
    board.deleteColumn(TODO.id)
    const added = makeColumn("col-new", "Later")
    board.addColumn(added)
    await vault.sync()

    expect(await fs.readDir(`${ROOT}/to_do`)).toBeNull()
    expect(await fs.readDir(`${ROOT}/later`)).toEqual([])
  })

  it("writes a restored column's cards back into a fresh folder", async () => {
    const card = board.add(makeCard({ columnId: TODO.id, title: "Ship it" }))
    await vault.sync()
    board.deleteColumn(TODO.id)
    await vault.sync()

    board.restoreColumn(TODO)
    await vault.sync()

    expect(board.cardsById.has(card.id)).toBe(true)
    expect(fs.files.get(`${ROOT}/to_do/ship_it.md`)).toContain(`id: ${card.id}`)
    expect(fs.files.has(`${ROOT}/_trash/ship_it.md`)).toBe(false)
  })

  it("brings a retired column's card back when its file leaves the trash", async () => {
    const card = board.add(makeCard({ columnId: TODO.id, title: "Ship it" }))
    await vault.sync()
    board.deleteColumn(TODO.id)
    await vault.sync()

    await fs.rename(`${ROOT}/_trash/ship_it.md`, `${ROOT}/done/ship_it.md`)
    await vault.sync()

    expect(board.cardsById.get(card.id)?.columnId).toBe(DONE.id)
  })

  it("makes a column out of a folder dropped into the root", async () => {
    await vault.sync()
    await fs.mkdir(`${ROOT}/later`)
    await vault.sync()

    expect(board.columns().map((col) => col.title)).toContain("Later")
    expect(changes).toBe(1)
  })

  it("brings a retired column back when its folder is put back", async () => {
    const card = board.add(makeCard({ columnId: TODO.id, title: "Ship it" }))
    await vault.sync()
    const saved = fs.files.get(`${ROOT}/to_do/ship_it.md`)!

    board.deleteColumn(TODO.id)
    await vault.sync()
    expect(await fs.readDir(`${ROOT}/to_do`)).toBeNull()

    await fs.mkdir(`${ROOT}/to_do`)
    await fs.write(`${ROOT}/to_do/ship_it.md`, saved)
    await vault.sync()

    const back = board.cardsById.get(card.id)
    expect(back?.title).toBe("Ship it")
    expect(board.column(back!.columnId)?.title).toBe("To do")

    await vault.sync()
    expect(fs.files.has(`${ROOT}/_trash/ship_it.md`)).toBe(false)
    expect(fs.files.has(`${ROOT}/to_do/ship_it.md`)).toBe(true)
  })

  it("leaves _trash and _files out of the columns", async () => {
    board.add(makeCard({ columnId: TODO.id, title: "Ship it" }))
    await vault.sync()
    await fs.mkdir(`${ROOT}/_files`)
    await vault.sync()

    expect(board.columns()).toHaveLength(2)
  })

  it("fills an empty board from the folder it is pointed at", async () => {
    const theirTodo = makeColumn("col-their-todo", "To do")
    const theirDone = makeColumn("col-their-done", "Done")
    const other = new FakeBoard([theirTodo, theirDone])
    other.add(makeCard({ columnId: theirTodo.id, title: "Ship it", body: "soon" }))
    other.add(makeCard({ columnId: theirDone.id, title: "Shipped" }))
    await new Vault({ fs, board: other, boardId: "board-2", root: ROOT }).sync()

    const empty = new FakeBoard([])
    const mine = new Vault({ fs, board: empty, boardId: BOARD, root: ROOT })
    await mine.claim()
    await mine.sync()

    expect(empty.columns().map((col) => col.title)).toEqual(["To do", "Done"])
    const cards = [...empty.cardsById.values()]
    expect(cards.map((card) => card.title).sort()).toEqual([
      "Ship it",
      "Shipped",
    ])
    const shipIt = cards.find((card) => card.title === "Ship it")
    expect(shipIt?.body).toBe("soon")
    expect(empty.column(shipIt!.columnId)?.title).toBe("To do")
    expect(fs.files.has(`${ROOT}/_trash/ship_it.md`)).toBe(false)
  })

  it("fills an empty board from a folder tree made by hand", async () => {
    await fs.mkdir(`${ROOT}/in_progress`)
    await fs.write(`${ROOT}/in_progress/ship_it.md`, "soon\n")

    const empty = new FakeBoard([])
    await new Vault({ fs, board: empty, boardId: BOARD, root: ROOT }).sync()

    expect(empty.columns().map((col) => col.title)).toEqual(["In progress"])
    const card = [...empty.cardsById.values()][0]
    expect(card.title).toBe("Ship it")
    expect(card.body).toBe("soon")
  })

  it("replicates a folder another board mirrored into this one", async () => {
    const theirs = makeColumn("col-their-todo", "To do")
    const other = new FakeBoard([theirs])
    other.add(makeCard({ columnId: theirs.id, title: "Ship it" }))
    await new Vault({ fs, board: other, boardId: "board-2", root: ROOT }).sync()

    await vault.claim()
    await vault.sync()

    const copied = [...board.cardsById.values()].find(
      (card) => card.title === "Ship it"
    )
    expect(copied).toBeDefined()
    expect(copied!.columnId).toBe(TODO.id)
    expect(fs.files.has(`${ROOT}/_trash/ship_it.md`)).toBe(false)
  })

  it("brings the card back when its file is dragged out of the trash", async () => {
    const card = board.add(makeCard({ columnId: TODO.id, title: "Ship it" }))
    await vault.sync()

    await fs.rename(`${ROOT}/to_do/ship_it.md`, `${ROOT}/_trash/ship_it.md`)
    await vault.sync()
    expect(board.cardsById.has(card.id)).toBe(false)

    await fs.rename(`${ROOT}/_trash/ship_it.md`, `${ROOT}/done/ship_it.md`)
    await vault.sync()

    expect(board.cardsById.get(card.id)?.columnId).toBe(DONE.id)
  })

  it("knows what it wrote last run", async () => {
    const card = board.add(makeCard({ columnId: TODO.id, title: "Ship it" }))
    await vault.sync()

    // A restart: same folder, same board, a vault that remembers nothing.
    const next = new Vault({ fs, board, boardId: BOARD, root: ROOT })
    fs.files.delete(`${ROOT}/to_do/ship_it.md`)
    await next.sync()

    expect(board.cardsById.has(card.id)).toBe(false)
    expect(fs.files.has(`${ROOT}/_trash/ship_it.md`)).toBe(true)
  })

  it("renames the file when the card is retitled", async () => {
    const card = board.add(makeCard({ columnId: TODO.id, title: "Ship it" }))
    await vault.sync()

    await board.updateCard(card.id, { title: "Ship it later" })
    await vault.sync()

    expect(fs.files.has(`${ROOT}/to_do/ship_it.md`)).toBe(false)
    expect(fs.files.get(`${ROOT}/to_do/ship_it_later.md`)).toContain(
      "title: Ship it later"
    )
  })

  it("leaves a file that only took a collision suffix alone", async () => {
    board.add(makeCard({ columnId: TODO.id, title: "Ship it" }))
    const second = board.add(
      makeCard({ columnId: TODO.id, title: "Ship it", body: "one" })
    )
    await vault.sync()

    await board.updateCard(second.id, { body: "two" })
    await vault.sync()

    expect(fs.files.get(`${ROOT}/to_do/ship_it_2.md`)).toContain("two")
    expect(fs.files.has(`${ROOT}/to_do/ship_it_3.md`)).toBe(false)
  })

  it("makes a second card out of a copy of a card's file", async () => {
    const card = board.add(makeCard({ columnId: TODO.id, title: "Ship it" }))
    await vault.sync()

    const copy = `${ROOT}/to_do/ship_it copy.md`
    await fs.write(copy, fs.files.get(`${ROOT}/to_do/ship_it.md`)!)
    await vault.sync()

    const ids = [...board.cardsById.keys()]
    expect(ids).toHaveLength(2)
    const other = ids.find((id) => id !== card.id)!
    expect(fs.files.get(copy)).toContain(`id: ${other}`)
  })

  it("leaves files that aren't Markdown, and dotfiles, alone", async () => {
    await vault.sync()
    await fs.write(`${ROOT}/to_do/notes.txt`, "not a card\n")
    await fs.write(`${ROOT}/to_do/.hidden.md`, "not a card\n")
    await vault.sync()

    expect(board.cardsById.size).toBe(0)
    expect(fs.files.get(`${ROOT}/to_do/notes.txt`)).toBe("not a card\n")
    expect(fs.files.get(`${ROOT}/to_do/.hidden.md`)).toBe("not a card\n")
  })

  it("keeps the name a user gave the file by hand", async () => {
    const card = board.add(makeCard({ columnId: TODO.id, title: "Ship it" }))
    await vault.sync()

    await fs.rename(`${ROOT}/to_do/ship_it.md`, `${ROOT}/to_do/my_notes.md`)
    await vault.sync()
    await vault.sync()

    expect(fs.files.has(`${ROOT}/to_do/my_notes.md`)).toBe(true)
    expect(fs.files.has(`${ROOT}/to_do/ship_it.md`)).toBe(false)
    expect(board.cardsById.get(card.id)?.title).toBe("Ship it")
    expect(board.deleteCalls).toEqual([])
  })

  it("cuts a long title down to a filename", async () => {
    board.add(makeCard({ columnId: TODO.id, title: "a".repeat(100) }))
    await vault.sync()

    expect(fs.files.has(`${ROOT}/to_do/${"a".repeat(60)}.md`)).toBe(true)
  })

  it("gives an untitled card a file anyway", async () => {
    board.add(makeCard({ columnId: TODO.id }))
    await vault.sync()

    expect(fs.files.has(`${ROOT}/to_do/card.md`)).toBe(true)
  })

  it("folds syncs that overlap into one extra pass", async () => {
    board.add(makeCard({ columnId: TODO.id, title: "Ship it" }))
    const load = vi.spyOn(board, "load")

    await Promise.all([vault.sync(), vault.sync(), vault.sync()])

    // The two that arrived mid-pass collapse into the single queued one.
    expect(load).toHaveBeenCalledTimes(2)
  })

  it("writes nothing on a pass that changes nothing", async () => {
    board.add(makeCard({ columnId: TODO.id, title: "Ship it" }))
    await vault.sync()

    const write = vi.spyOn(fs, "write")
    await vault.sync()

    expect(write).not.toHaveBeenCalled()
  })

  it("starts over when _meta.json is unreadable", async () => {
    const card = board.add(makeCard({ columnId: TODO.id, title: "Ship it" }))
    await vault.sync()

    await fs.write(`${ROOT}/_meta.json`, "{ not json")
    fs.files.delete(`${ROOT}/to_do/ship_it.md`)
    // Nothing is known to have been written, so the file reads as missing
    // rather than as deleted: the card keeps it.
    await new Vault({ fs, board, boardId: BOARD, root: ROOT }).sync()

    expect(board.cardsById.has(card.id)).toBe(true)
    expect(fs.files.has(`${ROOT}/to_do/ship_it.md`)).toBe(true)
  })

  it("skips _files when there is nothing to fetch bytes from", async () => {
    board.add(makeCard({ columnId: TODO.id, title: "Ship it" }))
    await vault.sync()

    expect(await fs.readDir(`${ROOT}/_files`)).toBeNull()
  })

  it("refuses a folder another board is mirroring", async () => {
    const other = new FakeBoard([makeColumn("col-their-todo", "To do")])
    await new Vault({ fs, board: other, boardId: "board-2", root: ROOT }).sync()

    await expect(vault.sync()).rejects.toThrow(/another board/)
  })

  it("takes a folder over once the board claims it", async () => {
    const other = new FakeBoard([makeColumn("col-their-todo", "To do")])
    const theirs = new Vault({ fs, board: other, boardId: "board-2", root: ROOT })
    await theirs.sync()

    await vault.claim()
    await vault.sync()
    await expect(theirs.sync()).rejects.toThrow(/another board/)
  })

  it("keeps the board title in the folder", async () => {
    board.name = "Work"
    await vault.sync()
    expect(JSON.parse(fs.files.get(`${ROOT}/_meta.json`)!).title).toBe("Work")

    await board.rename("Home")
    await vault.sync()
    expect(JSON.parse(fs.files.get(`${ROOT}/_meta.json`)!).title).toBe("Home")
  })

  it("takes the board title from the folder it claims", async () => {
    const other = new FakeBoard([makeColumn("col-their-todo", "To do")])
    other.name = "Work"
    await new Vault({ fs, board: other, boardId: "board-2", root: ROOT }).sync()

    await vault.claim()
    await vault.sync()

    expect(board.name).toBe("Work")
  })

  it("names a folder after its column when the title has no letters", async () => {
    const odd = makeColumn("col-odd", "***")
    const only = new FakeBoard([odd])
    only.add(makeCard({ columnId: odd.id, title: "Ship it" }))
    await new Vault({ fs, board: only, boardId: BOARD, root: ROOT }).sync()

    expect(fs.files.has(`${ROOT}/${odd.id}/ship_it.md`)).toBe(true)
  })
})

describe("Vault restore", () => {
  let fs: MemoryFs
  let board: FakeBoard
  let vault: Vault

  beforeEach(() => {
    fs = new MemoryFs()
    void fs.mkdir(ROOT)
    board = new FakeBoard([TODO, DONE])
    vault = new Vault({ fs, board, boardId: BOARD, root: ROOT })
  })

  it("writes the file back when the card is restored in the app", async () => {
    const card = board.add(
      makeCard({ columnId: TODO.id, title: "Ship it", body: "soon" })
    )
    await vault.sync()
    await board.deleteCard(card.id)
    await vault.sync()
    expect(fs.files.has(`${ROOT}/_trash/ship_it.md`)).toBe(true)

    await board.restoreCard(card.id)
    await vault.sync()

    expect(fs.files.get(`${ROOT}/to_do/ship_it.md`)).toContain("soon")
    // The copy has to go, or the next pass reads it as a card dragged to the
    // trash and deletes the card straight back out again.
    expect(fs.files.has(`${ROOT}/_trash/ship_it.md`)).toBe(false)
    expect(board.cardsById.has(card.id)).toBe(true)
  })

  it("leaves the restored card alone on later passes", async () => {
    const card = board.add(makeCard({ columnId: TODO.id, title: "Ship it" }))
    await vault.sync()
    await board.deleteCard(card.id)
    await vault.sync()
    await board.restoreCard(card.id)
    await vault.sync()
    await vault.sync()

    expect(board.cardsById.has(card.id)).toBe(true)
    expect(board.deleteCalls).toEqual([card.id])
  })

  it("restores into the column the card was moved to while deleted", async () => {
    const card = board.add(makeCard({ columnId: TODO.id, title: "Ship it" }))
    await vault.sync()
    await board.deleteCard(card.id)
    await vault.sync()

    await board.restoreCard(card.id)
    await board.moveCardToColumn(card.id, DONE.id)
    await vault.sync()

    expect(fs.files.has(`${ROOT}/done/ship_it.md`)).toBe(true)
    expect(fs.files.has(`${ROOT}/to_do/ship_it.md`)).toBe(false)
  })

  it("still deletes a live card whose file is dragged into _trash", async () => {
    const card = board.add(makeCard({ columnId: TODO.id, title: "Ship it" }))
    await vault.sync()

    const text = fs.files.get(`${ROOT}/to_do/ship_it.md`)!
    await fs.remove(`${ROOT}/to_do/ship_it.md`)
    await fs.write(`${ROOT}/_trash/ship_it.md`, text)
    await vault.sync()

    expect(board.cardsById.has(card.id)).toBe(false)

    // And that copy is the vault's business now, so restoring in the app
    // brings the file back rather than re-deleting the card.
    await board.restoreCard(card.id)
    await vault.sync()
    expect(board.cardsById.has(card.id)).toBe(true)
    expect(fs.files.has(`${ROOT}/to_do/ship_it.md`)).toBe(true)
  })

  it("forgets a trash copy someone emptied by hand", async () => {
    const card = board.add(makeCard({ columnId: TODO.id, title: "Ship it" }))
    await vault.sync()
    await board.deleteCard(card.id)
    await vault.sync()

    await fs.remove(`${ROOT}/_trash/ship_it.md`)
    await vault.sync()

    expect(fs.files.get(`${ROOT}/_meta.json`)).not.toContain(card.id)
  })
})

describe("Vault attachments", () => {
  const KEY = "att/00000000-0000-0000-0000-000000000000.png"

  let fs: MemoryFs
  let board: FakeBoard
  let files: FakeFiles
  let vault: Vault

  beforeEach(() => {
    fs = new MemoryFs()
    void fs.mkdir(ROOT)
    board = new FakeBoard([TODO, DONE])
    files = new FakeFiles()
    vault = new Vault({ fs, board, boardId: BOARD, files, root: ROOT })
  })

  it("mirrors a card's attachments into _files, once", async () => {
    board.add(
      makeCard({
        columnId: TODO.id,
        title: "Ship it",
        body: `![shot](attachment:${KEY})`,
        attachments: [
          { id: "a1", name: "shot.png", key: KEY, mime: "image/png", size: 3 },
        ],
      })
    )
    await vault.sync()

    expect(fs.files.has(`${ROOT}/_files/${KEY.slice(4)}`)).toBe(true)
    expect(fs.files.get(`${ROOT}/to_do/ship_it.md`)).toContain(
      `![shot](../_files/${KEY.slice(4)})`
    )

    // A file already there is the same file: no second fetch.
    await vault.sync()
    expect(files.fetched).toEqual([KEY])
  })

  it("syncs the text anyway when the bytes can't be fetched", async () => {
    files.failing = true
    board.add(
      makeCard({
        columnId: TODO.id,
        title: "Ship it",
        attachments: [
          { id: "a1", name: "shot.png", key: KEY, mime: "image/png", size: 3 },
        ],
      })
    )
    await vault.sync()

    expect(fs.files.has(`${ROOT}/to_do/ship_it.md`)).toBe(true)
    expect(fs.files.has(`${ROOT}/_files/${KEY.slice(4)}`)).toBe(false)
    // Nothing was cached, so the next pass tries again.
    await vault.sync()
    expect(files.fetched).toEqual([KEY, KEY])
  })

  it("keeps the app's ref when the file around it is edited", async () => {
    const card = board.add(
      makeCard({
        columnId: TODO.id,
        title: "Ship it",
        body: `![shot](attachment:${KEY})`,
        attachments: [
          { id: "a1", name: "shot.png", key: KEY, mime: "image/png", size: 3 },
        ],
      })
    )
    await vault.sync()

    // An edit is what sends the file's body back to the board, so it is the
    // pass that would clobber the ref with the on-disk rewrite of it.
    const path = `${ROOT}/to_do/ship_it.md`
    await fs.write(path, `${fs.files.get(path)!}a note\n`)
    await vault.sync()

    expect(board.cardsById.get(card.id)?.body).toBe(
      `![shot](attachment:${KEY})\na note`
    )
  })
})
