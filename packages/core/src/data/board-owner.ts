import { useBoardMembers, useSession } from "./queries"

export function useIsBoardOwner(boardId: string): boolean {
  const { data: session } = useSession()
  const authed = session?.authed ?? false
  const { data: roster } = useBoardMembers(boardId, authed)
  return !authed || roster?.viewerRole === "owner"
}
