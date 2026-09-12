import { useEffect, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { getCurrentWindow } from "@tauri-apps/api/window"
import { CARDS } from "@doska/core/constants"
import { db } from "@doska/core/db"
import { keys } from "@doska/core/keys"
import { LAST_CARD_KEY, useCardSave } from "@doska/core/mutations"
import {
  createCard,
  deleteCard,
  moveCardToColumn,
} from "@doska/core/operations"
import { useCard, useCardCol } from "@doska/core/queries"
import { sync } from "@doska/core/sync"
import type { Column } from "@doska/core/types"
import type { Draft } from "@/components/card-panel/card-pane"
import { isDesktop } from "@/lib/platform"

interface Target {
  boardId: string | null
  column: Column | undefined
}

export function useQuickNoteCard(target: Target) {
  const qc = useQueryClient()
  const [keptCard, setKeptCard] = useState(() =>
    localStorage.getItem(LAST_CARD_KEY)
  )
  const { data: content } = useCard(keptCard)
  // The remembered card may have been deleted or purged from another window.
  const stale =
    content !== undefined && (content.id !== keptCard || content.deletedAt)
  const cardId = stale ? null : keptCard
  const column = useCardCol(cardId).data ?? null
  const { queue: save, flush } = useCardSave()

  const draft = useRef<Draft>({})
  const creating = useRef(false)
  const [shows, setShows] = useState(0)

  function keep(id: string | null) {
    if (id) localStorage.setItem(LAST_CARD_KEY, id)
    else localStorage.removeItem(LAST_CARD_KEY)
    draft.current = {}
    setKeptCard(id)
  }

  async function create() {
    if (!target.boardId || !target.column || creating.current) return
    creating.current = true
    try {
      const id = await createCard(target.column.id)
      qc.invalidateQueries({ queryKey: keys.board(target.boardId) })
      keep(id)
    } finally {
      creating.current = false
    }
  }

  // Without a card while up (first show, ⌘N, a stale id), make one.
  const latest = useRef(create)
  useEffect(() => {
    latest.current = create
  })
  useEffect(() => {
    if (cardId || !target.column) return
    if (!isDesktop()) {
      void latest.current()
      return
    }
    void getCurrentWindow()
      .isVisible()
      .then((visible) => {
        if (visible) void latest.current()
      })
  }, [cardId, target.column])

  /** Picks up the card edited last, which the main window may have changed or moved meanwhile. */
  function refresh() {
    flush()
    const id = localStorage.getItem(LAST_CARD_KEY)
    if (!id || (id === keptCard && !cardId)) {
      void create()
      return
    }
    draft.current = {}
    qc.invalidateQueries({ queryKey: keys.card(id) })
    qc.invalidateQueries({ queryKey: keys.cardCol(id) })
    if (id === keptCard) setShows((n) => n + 1)
    else setKeptCard(id)
  }

  function queue(id: string, patch: Draft) {
    draft.current = { ...draft.current, ...patch }
    save(id, patch)
  }

  function isEmpty() {
    const title = draft.current.title ?? content?.title ?? ""
    const body = draft.current.body ?? content?.body ?? ""
    return (
      !title.trim() && !body.trim() && (content?.attachments.length ?? 0) === 0
    )
  }

  /** A card the server never saw can vanish; one it has needs a tombstone. */
  async function discard() {
    if (!cardId) return
    if (content?.number == null) {
      sync.dropDirty(CARDS, [cardId])
      await db.hardDelete(CARDS, cardId)
    } else {
      await deleteCard(column?.dashboardId ?? "", cardId)
    }
  }

  /** To the top of that column. */
  async function moveTo(columnId: string) {
    if (!cardId || column?.id === columnId) return
    await moveCardToColumn(cardId, columnId)
    qc.invalidateQueries({ queryKey: keys.boards })
    qc.invalidateQueries({ queryKey: keys.card(cardId) })
    qc.invalidateQueries({ queryKey: keys.cardCol(cardId) })
  }

  return {
    cardId,
    content,
    column,
    shows,
    queue,
    flush,
    refresh,
    isEmpty,
    discard,
    moveTo,
    forget: () => keep(null),
  }
}
