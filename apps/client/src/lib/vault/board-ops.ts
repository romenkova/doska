import {
  activeStorage,
  createCard,
  createColumn,
  deleteCard,
  getBoard,
  getDeletedIds,
  listMembers,
  moveCardToColumn,
  renameColumn,
  restore,
  updateCard,
} from "@doska/core"
import type { Member } from "@doska/contract"
import type { VaultBoard, VaultFiles } from "@doska/vault"

/** Attachment bytes come from backend. */
export const vaultFiles: VaultFiles = {
  async get(cardId, key) {
    const blob = await activeStorage().get(cardId, key)
    return new Uint8Array(await blob.arrayBuffer())
  },
}

const MEMBERS = "deck:vault-members:"

/** The last members seen online when offline; empty if never seen. */
async function membersOf(boardId: string): Promise<Member[]> {
  const key = `${MEMBERS}${boardId}`
  try {
    const { members } = await listMembers(boardId)
    localStorage.setItem(key, JSON.stringify(members))
    return members
  } catch {
    const saved = localStorage.getItem(key)
    return saved ? (JSON.parse(saved) as Member[]) : []
  }
}

/** Card files name users by username; the board stores ids. */
export function boardOps(boardId: string): VaultBoard {
  return {
    load: async () => {
      const board = await getBoard(boardId)
      const members = await membersOf(boardId)
      const cards = board.cards.map((card) => ({
        ...card,
        users: members
          .filter((m) => (card.users ?? []).includes(m.userId))
          .map((m) => m.username),
      }))
      return { ...board, cards }
    },
    createCard,
    createColumn: (title) => createColumn(boardId, title),
    updateCard: async (id, patch) => {
      const names = patch.users
      if (!names) return updateCard(id, patch)
      const members = await membersOf(boardId)

      if (members.length === 0) {
        const rest = { ...patch }
        delete rest.users
        return updateCard(id, rest)
      }

      const users = members
        .filter((m) => names.includes(m.username))
        .map((m) => m.userId)
      return updateCard(id, { ...patch, users })
    },
    moveCardToColumn: async (id, columnId) => {
      await moveCardToColumn(id, columnId)
    },
    renameColumn,
    deleteCard: (id) => deleteCard(boardId, id),
    restoreCard: (id) => restore("cards", id),
    deleted: () => getDeletedIds(boardId),
  }
}
