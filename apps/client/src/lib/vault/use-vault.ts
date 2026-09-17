import { activeStorage } from "@doska/core/attachments"
import { keys } from "@doska/core/keys"
import {
  createCard,
  createColumn,
  deleteCard,
  getBoard,
  getDeletedIds,
  moveCardToColumn,
  renameColumn,
  restore,
  updateCard,
} from "@doska/core/operations"
import { Vault, type VaultBoard, type VaultFiles } from "@doska/vault"
import { useQueryClient } from "@tanstack/react-query"
import { useCallback, useEffect, useState } from "react"
import { isDesktop } from "../platform"
import { tauriFs } from "./tauri-fs"

const PATHS = "deck:vault:"
const pathKey = (boardId: string) => `${PATHS}${boardId}`

/** The other board already mirroring `path` on this device, if there is one. */
function holder(path: string, boardId: string): string | null {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key?.startsWith(PATHS)) continue
    const id = key.slice(PATHS.length)
    if (id !== boardId && localStorage.getItem(key) === path) return id
  }
  return null
}

/**
 * Rust-side, because the fs plugin can't
 * touch a dotfile in a folder the picker granted.
 */
async function ignore(root: string): Promise<void> {
  const { invoke } = await import("@tauri-apps/api/core")
  await invoke("ignore_vault", { dir: root })
}

function message(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause)
}

/** Attachment bytes come from backend. */
const vaultFiles: VaultFiles = {
  async get(cardId, key) {
    const blob = await activeStorage().get(cardId, key)
    return new Uint8Array(await blob.arrayBuffer())
  },
}

function boardOps(boardId: string): VaultBoard {
  return {
    load: () => getBoard(boardId),
    createCard,
    createColumn: (title) => createColumn(boardId, title),
    updateCard,
    moveCardToColumn: async (id, columnId) => {
      await moveCardToColumn(id, columnId)
    },
    renameColumn,
    deleteCard: (id) => deleteCard(boardId, id),
    restoreCard: (id) => restore("cards", id),
    deleted: () => getDeletedIds(boardId),
  }
}

/**
 * Mirrors a board to a folder the user picks: one folder per column, one
 * Markdown file per card, edits flowing both ways.
 */
export function useVault(boardId: string) {
  const qc = useQueryClient()
  const [path, setPath] = useState<string | null>(() =>
    isDesktop() ? localStorage.getItem(pathKey(boardId)) : null
  )
  const [error, setError] = useState<string | null>(null)

  // TODO: that would be better to invalidate exact queries for the board
  // but it's a big change
  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: keys.boards })
    qc.invalidateQueries({ queryKey: keys.cards })
    qc.invalidateQueries({ queryKey: keys.cardCols })
    qc.invalidateQueries({ queryKey: keys.digest })
    qc.invalidateQueries({ queryKey: keys.trash })
  }, [qc])

  useEffect(() => {
    if (!path) return

    let live = true
    let unwatch: (() => void) | null = null
    const vault = new Vault({
      fs: tauriFs,
      board: boardOps(boardId),
      boardId,
      files: vaultFiles,
      root: path,
      onError: (cause) => setError(message(cause)),
      onBoardChange: () => {
        setError(null)
        invalidate()
      },
    })

    const off = qc.getQueryCache().subscribe((event) => {
      if (event.type !== "updated" || event.action.type !== "success") return
      if (event.query.queryKey[0] !== keys.boards[0]) return
      vault
        .sync()
        .then(() => setError(null))
        .catch((cause: unknown) => setError(message(cause)))
    })

    void vault
      .watch()
      .then((stopWatch) => {
        if (!live) return stopWatch()
        unwatch = stopWatch
      })
      .catch((cause: unknown) => {
        if (!live) return
        setError(message(cause))
        localStorage.removeItem(pathKey(boardId))
        setPath(null)
      })

    return () => {
      live = false
      off()
      unwatch?.()
    }
  }, [boardId, path, qc, invalidate])

  const mount = useCallback(async () => {
    const { open } = await import("@tauri-apps/plugin-dialog")
    const picked = await open({ directory: true, recursive: true })
    if (typeof picked !== "string") return

    if (holder(picked, boardId)) {
      setError("That folder already mirrors another board.")
      return
    }

    setError(null)
    await ignore(picked).catch((cause: unknown) => setError(message(cause)))
    // Takes the folder from whatever board held it: picking it is deliberate.
    try {
      await new Vault({
        fs: tauriFs,
        board: boardOps(boardId),
        boardId,
        root: picked,
      }).claim()
    } catch (cause) {
      setError(message(cause))
      return
    }
    localStorage.setItem(pathKey(boardId), picked)
    setPath(picked)
  }, [boardId])

  const unmount = useCallback(() => {
    localStorage.removeItem(pathKey(boardId))
    setPath(null)
  }, [boardId])

  return { available: isDesktop(), path, error, mount, unmount }
}
