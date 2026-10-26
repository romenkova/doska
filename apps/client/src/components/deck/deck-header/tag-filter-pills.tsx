import {
  filterByTags,
  filterByUsers,
  useActiveUsers,
  type Card,
} from "@doska/core"
import { TriangleAlert } from "lucide-react"
import { Fragment } from "react"
import { useDeck } from "@/providers/deck/deck-context"
import { useAuth } from "@/lib/hooks"
import { FilterPill } from "./filter-pill"

function names(list: string[]) {
  return list.map((name, i) => (
    <Fragment key={name}>
      {i > 0 && ", "}
      <strong className="font-semibold text-foreground">{name}</strong>
    </Fragment>
  ))
}

interface IProps {
  cards: Card[]
}

/** The strip under the board header listing the active user and tag filters. */
export function TagFilterPills({ cards }: IProps) {
  const {
    tagFilters = [],
    toggleTagFilter,
    userFilters = [],
    toggleUserFilter,
  } = useDeck()
  const { authed } = useAuth()
  const { data: activeUsers = [] } = useActiveUsers(!!authed)

  const users = activeUsers.filter((user) => userFilters.includes(user.id))
  if (tagFilters.length === 0 && users.length === 0) return null

  const unusedTags = tagFilters.filter(
    (tag) => filterByTags(cards, [tag]).length === 0
  )
  const noMatches =
    filterByUsers(filterByTags(cards, tagFilters), userFilters).length === 0

  return (
    <div className="flex shrink-0 flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b px-4 py-1.5">
        {toggleUserFilter &&
          users.map((user) => (
            <FilterPill
              key={user.id}
              label={user.username}
              prefix="@"
              onClear={() => toggleUserFilter(user.id)}
            />
          ))}
        {toggleTagFilter &&
          tagFilters.map((tag) => (
            <FilterPill
              key={tag}
              label={tag}
              prefix="#"
              onClear={() => toggleTagFilter(tag)}
            />
          ))}
      </div>
      {(unusedTags.length > 0 || noMatches) && (
        <div className="flex flex-col gap-1 px-4 py-1.5">
          {unusedTags.length > 0 && (
            <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>
                No cards tagged {names(unusedTags.map((tag) => `#${tag}`))}. If
                you added a tag in a card body, it's just a link: attach tags
                through the card menu.
              </span>
            </p>
          )}
          {noMatches && unusedTags.length === 0 && (
            <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>No card matches all of these filters.</span>
            </p>
          )}
        </div>
      )}
    </div>
  )
}
