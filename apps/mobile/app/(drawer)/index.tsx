import { sync } from "@doska/core/sync"
import { useFocusEffect } from "expo-router"
import { useCallback } from "react"
import { View } from "react-native"
import { Board } from "@/components/board/board"
import { NoBoards } from "@/components/board/no-boards"
import { useActiveBoard } from "@/lib/use-active-board"

export default function BoardScreen() {
  const { board, deckId, isPending } = useActiveBoard()

  useFocusEffect(
    useCallback(() => {
      sync.setActiveBoard(deckId)
    }, [deckId])
  )

  return (
    <View className="flex-1 bg-background">
      {board ? <Board board={board} /> : <NoBoards isPending={isPending} />}
    </View>
  )
}
