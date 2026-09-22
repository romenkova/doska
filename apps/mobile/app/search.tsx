import { EmptyState } from "@doska/ui-kit-mobile"
import { router } from "expo-router"
import { useState } from "react"
import { View } from "react-native"
import { SearchField } from "@/components/search/search-field"
import { SearchResults } from "@/components/search/search-results"
import { ROUTES } from "@/lib/routes"
import { useActiveBoard } from "@/lib/use-active-board"

export default function SearchScreen() {
  const { board } = useActiveBoard()
  const [query, setQuery] = useState("")

  return (
    <View className="flex-1 bg-background">
      <SearchField
        value={query}
        onChangeText={setQuery}
        onCancel={() => router.back()}
      />
      {board ? (
        <SearchResults
          deckId={board.id}
          query={query}
          // Replace, so closing the card lands on the board, not a stale query.
          onSelect={(cardId) => router.replace(ROUTES.card(cardId))}
        />
      ) : (
        <EmptyState message="No board to search." />
      )}
    </View>
  )
}
