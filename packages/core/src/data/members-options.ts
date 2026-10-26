import { useMemo } from "react"
import type { PrefixOption } from "@doska/markdown/core"
import { useBoardMembers } from "./queries"

/**
 * Users list, for the `@` menu
 */
export function useMembersOptions(
  deckId: string,
  enabled: boolean
): PrefixOption[] {
  const { data: usersData } = useBoardMembers(deckId, enabled)

  return useMemo(
    () => usersData?.members?.map(({ username }) => ({ name: username })) ?? [],
    [usersData]
  )
}
