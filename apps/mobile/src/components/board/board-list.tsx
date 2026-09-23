import { useCreateCard, useMoveCard } from "@doska/core/mutations"
import { useBoard } from "@doska/core/queries"
import type { Card, Column, Dashboard } from "@doska/core/types"
import {
  byPosition,
  dropNeighbours,
  keyBetween,
  sortCards,
} from "@doska/core/utils"
import { EmptyState, Spinner } from "@doska/ui-kit-mobile"
import { useCallback, useMemo, useRef, useState } from "react"
import {
  RefreshControl,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native"
import Animated, { useAnimatedRef } from "react-native-reanimated"
import Sortable, {
  type SortableGridDragEndParams,
  type SortableGridRenderItem,
} from "react-native-sortables"
import { BoardCard } from "@/components/card/board-card"
import { ColumnHead } from "@/components/column/column-head"
import { useSyncRefresh } from "@/lib/use-sync-refresh"

/** Held this long without moving, a card lifts instead of the list scrolling. */
const PICKUP_MS = 250
const ROW_GAP = 12
// Stable, so the rows aren't rebuilt every render for an unsorted board.
const NO_SORT: string[] = []

type Row =
  | { kind: "column"; key: string; column: Column }
  | { kind: "card"; key: string; card: Card; done: boolean }

/** The column a card dropped at `index` joins, and how many of its cards
 * sit above the drop. */
function landing(rows: Row[], index: number) {
  for (let i = index - 1; i >= 0; i--) {
    const row = rows[i]!
    if (row.kind === "column")
      return { column: row.column, slot: index - i - 1 }
  }
  // Dropped above the first header: the top of the first column.
  const first = rows.find((row) => row.kind === "column")
  return {
    column: first?.kind === "column" ? first.column : undefined,
    slot: 0,
  }
}

interface IProps {
  board: Dashboard
}

/**
 * Every column in one scroll, each a header followed by its cards. Headers
 * can't be picked up but shift with the order, so a card's column is simply
 * the header above wherever it was dropped.
 */
export function BoardList({ board: dashboard }: IProps) {
  const deckId = dashboard.id
  const { data: board } = useBoard(deckId)
  const { mutate: createCard } = useCreateCard(deckId)
  const { mutate: moveCard } = useMoveCard(deckId)
  const scrollRef = useAnimatedRef<Animated.ScrollView>()
  const heights = useRef(new Map<string, number>())
  const [stuckId, setStuckId] = useState<string | null>(null)
  const { refreshing, onRefresh } = useSyncRefresh([deckId])

  const sort = dashboard.sort ?? NO_SORT

  const cardsIn = useCallback(
    (columnId: string, except?: string) =>
      sortCards(
        (board?.cards ?? [])
          .filter((card) => card.columnId === columnId && card.id !== except)
          .sort(byPosition),
        sort
      ),
    [board, sort]
  )

  const rows = useMemo(() => {
    const columns = [...(board?.columns ?? [])].sort(byPosition)
    return columns.flatMap((column): Row[] => [
      { kind: "column", key: `column:${column.id}`, column },
      ...(column.collapsed ? [] : cardsIn(column.id)).map((card): Row => ({
        kind: "card",
        key: card.id,
        card,
        done: column.done,
      })),
    ])
  }, [board, cardsIn])

  const renderRow = useCallback<SortableGridRenderItem<Row>>(
    ({ item }) => (
      <View
        onLayout={(event: LayoutChangeEvent) =>
          heights.current.set(item.key, event.nativeEvent.layout.height)
        }
      >
        {item.kind === "column" ? (
          <Sortable.Handle mode="non-draggable">
            <ColumnHead
              deckId={deckId}
              column={item.column}
              onAddCard={() => createCard(item.column.id)}
            />
          </Sortable.Handle>
        ) : (
          <Sortable.Handle>
            <BoardCard card={item.card} done={item.done} />
          </Sortable.Handle>
        )}
      </View>
    ),
    [deckId, createCard]
  )

  // Sortables lays rows out absolutely, so the ScrollView can't stick them;
  // the header scrolled past is redrawn over the top instead.
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offset = event.nativeEvent.contentOffset.y
      let y = 0
      let stuck: string | null = null
      for (const row of rows) {
        if (y >= offset) break
        if (row.kind === "column") stuck = row.column.id
        y += (heights.current.get(row.key) ?? 0) + ROW_GAP
      }
      setStuckId(stuck)
    },
    [rows]
  )

  const handleDragEnd = useCallback(
    ({ data, fromIndex, toIndex }: SortableGridDragEndParams<Row>) => {
      if (fromIndex === toIndex) return
      const moved = data[toIndex]
      if (moved?.kind !== "card") return

      const { column, slot } = landing(data, toIndex)
      if (!column) return

      // A collapsed column shows no cards, so its slot is always 0: the top.
      const order = cardsIn(column.id, moved.card.id)
      const [prev, next] = dropNeighbours(order, slot, moved.card, sort)
      const position = keyBetween(prev, next)
      if (!position) return

      moveCard([{ ...moved.card, columnId: column.id, position }])
    },
    [moveCard, cardsIn, sort]
  )

  const stuck = board?.columns.find((column) => column.id === stuckId)

  if (!board) return <Spinner />

  if (rows.length === 0) {
    return <EmptyState message="No columns yet." />
  }

  return (
    <View className="flex-1">
      <Animated.ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerClassName="px-3 pb-6"
      >
        <Sortable.Grid
          columns={1}
          data={rows}
          keyExtractor={(row) => row.key}
          renderItem={renderRow}
          rowGap={ROW_GAP}
          customHandle
          dragActivationDelay={PICKUP_MS}
          scrollableRef={scrollRef}
          // A card is nearly as wide as the screen, so snapping its centre
          // under the finger throws it sideways as it lifts.
          enableActiveItemSnap={false}
          hapticsEnabled
          showDropIndicator
          onDragEnd={handleDragEnd}
        />
      </Animated.ScrollView>
      {stuck ? (
        <View className="absolute left-0 right-0 top-0 bg-background px-3 pb-2">
          <ColumnHead
            deckId={deckId}
            column={stuck}
            onAddCard={() => createCard(stuck.id)}
          />
        </View>
      ) : null}
    </View>
  )
}
