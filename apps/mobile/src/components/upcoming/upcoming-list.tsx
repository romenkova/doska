import { groupByDeadline, type DigestCard } from "@doska/core/operations"
import { EmptyState } from "@doska/ui-kit-mobile"
import { RefreshControl, SectionList } from "react-native"
import { GroupHeading } from "@/components/upcoming/group-heading"
import { toSection } from "@/components/upcoming/sections"
import { UpcomingRow } from "@/components/upcoming/upcoming-row"
import { useSyncRefresh } from "@/lib/use-sync-refresh"

interface IProps {
  cards: DigestCard[]
  hideDone: boolean
  boardIds: string[]
}

export function UpcomingList({ cards, hideDone, boardIds }: IProps) {
  const { refreshing, onRefresh } = useSyncRefresh(boardIds)
  const visible = hideDone ? cards.filter((one) => !one.isDone) : cards
  const sections = groupByDeadline(visible).map(toSection)

  if (sections.length === 0) return <EmptyState message="Nothing due." />

  return (
    <SectionList
      sections={sections}
      keyExtractor={(entry) => entry.card.id}
      contentContainerClassName="gap-2 p-3"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      renderSectionHeader={({ section }) => <GroupHeading section={section} />}
      renderItem={({ item }) => <UpcomingRow entry={item} />}
    />
  )
}
