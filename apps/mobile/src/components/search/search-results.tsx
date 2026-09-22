import { useBoard } from "@doska/core/queries"
import { searchCards } from "@doska/core/search"
import { EmptyState, Spinner } from "@doska/ui-kit-mobile"
import { useMemo } from "react"
import { FlatList, Text } from "react-native"
import { SearchResultRow } from "./search-result-row"

interface IProps {
  deckId: string
  query: string
  onSelect: (cardId: string) => void
}

export function SearchResults({ deckId, query, onSelect }: IProps) {
  const { data: board } = useBoard(deckId)
  const trimmed = query.trim()

  const hits = useMemo(
    () =>
      trimmed === "" || !board
        ? []
        : searchCards({
            cards: board.cards,
            columns: board.columns,
            query: trimmed,
          }),
    [board, trimmed]
  )

  if (trimmed === "") {
    return <EmptyState message="Type to search this board." />
  }
  if (!board) return <Spinner />
  if (hits.length === 0) {
    return <EmptyState message={`No cards match “${trimmed}”.`} />
  }

  return (
    <FlatList
      data={hits}
      keyExtractor={(hit) => hit.card.id}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      contentContainerClassName="gap-2 p-3"
      ListHeaderComponent={
        <Text className="pb-1 text-[13px] font-sans text-muted-foreground">
          {hits.length === 1 ? "1 result" : `${hits.length} results`}
        </Text>
      }
      renderItem={({ item }) => (
        <SearchResultRow hit={item} onPress={() => onSelect(item.card.id)} />
      )}
    />
  )
}
